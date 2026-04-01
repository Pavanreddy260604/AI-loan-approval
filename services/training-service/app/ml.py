from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO, UnsupportedOperation
from typing import Any

import joblib
import numpy as np
import pandas as pd
import torch
from imblearn.over_sampling import SMOTE
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score, precision_recall_curve, auc, brier_score_loss
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier

# Use shared MLP implementation to ensure training/inference consistency
from ai_utils import TabularMLP


@dataclass
class TrainedCandidate:
    family: str
    metrics: dict[str, float]
    bundle_bytes: bytes
    feature_importance: list[dict[str, float | str]]


def parse_dataset(file_name: str, payload: bytes | Any, chunksize: int | None = None) -> pd.DataFrame | Any:
    """
    World Class: Parses a dataset (CSV) with robust whitespace normalization.
    If chunksize is provided, returns a TextFileReader for memory-efficient iteration.
    """
    if isinstance(payload, bytes):
        buffer = BytesIO(payload)
    else:
        buffer = payload

    def reset_buffer() -> None:
        if not hasattr(buffer, "seek"):
            return
        try:
            buffer.seek(0)
        except (UnsupportedOperation, OSError, AttributeError):
            return

    def normalize_strings(series: pd.Series) -> pd.Series:
        normalized = series.astype("object").copy()
        non_null = normalized.notna()
        normalized.loc[non_null] = normalized.loc[non_null].map(lambda value: str(value).strip())
        return normalized.replace("", np.nan)

    if file_name.lower().endswith((".xlsx", ".xls")):
        if chunksize:
            print("[ML] Warning: chunksize not supported for Excel files. Loading fully.")
        df = pd.read_excel(buffer)
        df.columns = [str(c).strip() for c in df.columns]
        for col in df.select_dtypes(["object"]).columns:
            df[col] = normalize_strings(df[col])
        return df

    def normalize_frame(frame: pd.DataFrame) -> pd.DataFrame:
        normalized = frame.copy()
        
        # Conservative Header Detection: Only consider headers bogus if a strong majority
        # of them look like raw data values (numbers, yes/no, etc.) rather than column names.
        bogus_header = False
        sample_headers = [str(c).strip().lower() for c in normalized.columns]
        total_cols = len(sample_headers)
        
        if total_cols > 0:
            numeric_count = sum(1 for h in sample_headers if h.replace('.','',1).replace('-','',1).isdigit())
            data_keywords = {"graduate", "not graduate", "urban", "rural", "semiurban", "yes", "no", "male", "female", "y", "n"}
            keyword_count = sum(1 for h in sample_headers if h in data_keywords)
            data_like_ratio = (numeric_count + keyword_count) / total_cols
            
            # Only flag as bogus if more than half the headers look like data values
            if data_like_ratio > 0.5:
                print(f"[ML-HEURISTIC] Detected bogus header (ratio={data_like_ratio:.2f}): {sample_headers}")
                bogus_header = True
            
        if bogus_header:
            # Shift the current 'header' back as the first data row
            data_row = pd.DataFrame([normalized.columns], columns=normalized.columns)
            normalized = pd.concat([data_row, normalized], ignore_index=True)
            
            # Map known loan dataset layouts by column count
            known_headers = {
                10: [
                    "Dependents", "Education", "Self_Employed", "ApplicantIncome",
                    "AssetValue", "Loan_Term", "CIBIL_Score", "CoapplicantIncome",
                    "BankAssetValue", "Approved"
                ],
                13: [
                    "Loan_ID", "Dependents", "Education", "Self_Employed",
                    "ApplicantIncome", "LoanAmount", "Loan_Term", "CIBIL_Score",
                    "ResidentialAssets", "CommercialAssets", "LuxuryAssets",
                    "BankAssetValue", "Loan_Status"
                ],
            }
            
            col_count = len(normalized.columns)
            if col_count in known_headers:
                normalized.columns = known_headers[col_count]
                print(f"[ML-HEURISTIC] Mapped {col_count} columns to known loan dataset headers")
            else:
                normalized.columns = [f"Feature_{i+1}" for i in range(col_count)]
                print(f"[ML-HEURISTIC] Using generic Feature_N headers (count {col_count})")

        normalized.columns = [str(c).strip() for c in normalized.columns]
        for col in normalized.select_dtypes(["object"]).columns:
            normalized[col] = normalize_strings(normalized[col])
        return normalized


    def normalize_reader(reader: Any):
        for chunk in reader:
            yield normalize_frame(chunk)
    
    import io
    
    def get_text_stream(buf: Any) -> io.TextIOWrapper | Any:
        reset_buffer()
        if isinstance(buf, (BytesIO, io.BufferedIOBase)):
            return io.TextIOWrapper(buf, encoding='utf-8', errors='replace', newline='')
        return buf

    try:
        # We use a robust sniffer with the python engine for column detection
        # The python engine sniffer requires a text stream, not bytes
        text_stream = get_text_stream(buffer)
        
        df_iter = pd.read_csv(
            text_stream, 
            sep=None, 
            engine='python', 
            on_bad_lines='warn',
            encoding_errors='replace',
            chunksize=chunksize
        )
        
        if chunksize:
            return normalize_reader(df_iter)
        
        df = df_iter
    except Exception as e:
        print(f"[ML] Primary CSV parsing failed: {e}. Retrying with utf-8-sig...")
        reset_buffer()
        df = pd.read_csv(
            buffer,
            encoding='utf-8-sig',
            on_bad_lines='skip',
            chunksize=chunksize
        )
        if chunksize:
            return normalize_reader(df)

    # World Class: Normalize column names and string content
    # Handle leading/trailing whitespace which causes mapping failures
    return normalize_frame(df)


def prepare_dataset(df: pd.DataFrame, mapping: dict[str, Any]) -> tuple[pd.DataFrame, pd.Series, list[str], list[str]]:
    import difflib
    target = mapping["targetColumn"]
    excluded = set(mapping.get("excludedColumns", []))
    id_column = mapping.get("idColumn")
    if id_column:
        excluded.add(id_column)

    working = df.copy()
    
    # World Class: Google-Grade Smart Column Discovery
    actual_target = target
    if target not in working.columns:
        # 1. Try normalized case-insensitive stripped match
        header_map = {str(col).strip().lower(): str(col) for col in working.columns}
        normalized_target = str(target).strip().lower()
        
        if normalized_target in header_map:
            actual_target = header_map[normalized_target]
        else:
            # 2. Fuzzy Discovery: Try to find a similar column name
            all_cols = [str(c) for c in working.columns]
            suggestions = difflib.get_close_matches(target, all_cols, n=1, cutoff=0.6)
            
            if suggestions:
                actual_target = suggestions[0]
                print(f"[ML-SMART] Discovery: Mapped target '{target}' to closest match '{actual_target}'")
            else:
                # 3. Pattern Recognition: Look for common target keywords if user-specified mapping is missing
                target_keywords = {"status", "outcome", "target", "default", "decision", "result", "label", "y"}
                discovered = [col for col in all_cols if any(k in col.lower() for k in target_keywords)]
                
                if discovered:
                    # Pick the most likely one (ignoring identifiers)
                    actual_target = discovered[0]
                    print(f"[ML-SMART] Pattern Discovery: Mapped target '{target}' to likely field '{actual_target}'")
                else:
                    available = ", ".join(all_cols[:8]) + ("..." if len(all_cols) > 8 else "")
                    raise ValueError(f"Target column '{target}' not found in dataset. Please select a valid column like: {available}")

    target = actual_target
    working = working.loc[working[target].notna()].copy()
    
    if working.empty:
        raise ValueError(f"Target column '{target}' contains only missing values (NaN) and cannot be used for training.")

    # World Class: Robust label matching (Case-insensitive, stripped, and type-agnostic)
    pos_label = mapping["positiveLabel"]
    
    def is_positive_match(val):
        if val == pos_label:
            return True
        # Fallback to string-based comparison for robustness (handles 1 vs "1", "Passed" vs "passed ")
        try:
            return str(val).strip().lower() == str(pos_label).strip().lower()
        except (ValueError, TypeError):
            return False

    y = working[target].apply(lambda x: 1 if is_positive_match(x) else 0).astype(int)
    
    if len(y.unique()) < 2:
        found_values = ", ".join([str(v) for v in working[target].unique()[:5]])
        raise ValueError(
            f"Target column '{target}' contains only one class after mapping to positive label '{pos_label}'. "
            f"Binary classification requires at least two distinct outcomes (Pass/Fail). "
            f"Detected values in file: [{found_values}]"
        )

    # World Class: Honor user-defined exclusions and identifier mappings
    to_drop = [target]
    
    # Add explicitly excluded columns
    for ex in excluded:
        to_drop.append(str(ex))
        
    # Add the designated identifier column
    id_column = mapping.get("idColumn")
    if id_column:
        to_drop.append(str(id_column))

    # Perform case-insensitive matching for drop list
    existing_lower = {str(c).lower(): str(c) for c in working.columns}
    final_drop = []
    for col_to_drop in set(to_drop):
        norm_col = str(col_to_drop).strip().lower()
        if norm_col in existing_lower:
            final_drop.append(existing_lower[norm_col])
            
    x = working.drop(columns=[col for col in set(final_drop) if col in working.columns])
    
    # Cardinality Warning: Print a suggestion if we see a likely identifier that wasn't excluded
    for col in x.columns:
        if x[col].nunique() == len(x) and len(x) > 10:
             print(f"[ML-WARNING] Column '{col}' looks like an identifier (100% unique). Highly recommended to exclude it in mapping.")

    overrides = mapping.get("featureOverrides", {})
    numeric_features: list[str] = []
    categorical_features: list[str] = []

    for column in x.columns:
        override = overrides.get(column, {})
        inferred = override.get("type")
        if inferred == "numeric":
            numeric_features.append(column)
            continue
        if inferred in {"categorical", "boolean", "date"}:
            categorical_features.append(column)
            continue

        if pd.api.types.is_numeric_dtype(x[column]):
            numeric_features.append(column)
        else:
            categorical_features.append(column)

    # Explicitly coerce numeric features to numeric types to handle mixed strings/NaNs correctly
    for column in numeric_features:
        x[column] = pd.to_numeric(x[column], errors="coerce")

    return x, y, numeric_features, categorical_features


def build_preprocessor(numeric_features: list[str], categorical_features: list[str]) -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            (
                "num",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scaler", StandardScaler()),
                    ]
                ),
                numeric_features,
            ),
            (
                "cat",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                categorical_features,
            ),
        ],
    )


def transformed_feature_metadata(preprocessor: ColumnTransformer, numeric_features: list[str], categorical_features: list[str]) -> tuple[list[str], list[str]]:
    feature_names: list[str] = []
    feature_sources: list[str] = []
    feature_names.extend(numeric_features)
    feature_sources.extend(numeric_features)

    if categorical_features:
        encoder: OneHotEncoder = preprocessor.named_transformers_["cat"].named_steps["encoder"]
        for column_name, values in zip(categorical_features, encoder.categories_):
            for value in values:
                feature_names.append(f"{column_name}={value}")
                feature_sources.append(column_name)

    return feature_names, feature_sources


def compute_metrics(y_true: np.ndarray, probabilities: np.ndarray, threshold: float = 0.5) -> dict[str, float]:
    predictions = (probabilities >= threshold).astype(int)
    precision, recall, _ = precision_recall_curve(y_true, probabilities)
    return {
        "accuracy": float(accuracy_score(y_true, predictions)),
        "precision": float(precision_score(y_true, predictions, zero_division=0)),
        "recall": float(recall_score(y_true, predictions, zero_division=0)),
        "f1Score": float(f1_score(y_true, predictions, zero_division=0)),
        "rocAuc": float(roc_auc_score(y_true, probabilities)),
        "prAuc": float(auc(recall, precision)),
        "brierScore": float(brier_score_loss(y_true, probabilities)),
        "positiveRate": float(predictions.mean()),
        "threshold": float(threshold),
    }

def find_best_threshold(y_true: np.ndarray, probabilities: np.ndarray) -> float:
    # Find threshold with best F1 score
    precisions, recalls, thresholds = precision_recall_curve(y_true, probabilities)
    f1_scores = 2 * (precisions * recalls) / (precisions + recalls + 1e-8)
    best_idx = np.argmax(f1_scores)
    if len(thresholds) == 0:
        return 0.5
    if best_idx >= len(thresholds):
        return float(thresholds[-1])
    return float(thresholds[best_idx])


def train_mlp(x_train: np.ndarray, y_train: np.ndarray, x_valid: np.ndarray, y_valid: np.ndarray) -> tuple[dict[str, Any], dict[str, float]]:
    model = TabularMLP(x_train.shape[1])
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    criterion = torch.nn.BCEWithLogitsLoss()

    x_train_tensor = torch.tensor(x_train, dtype=torch.float32)
    y_train_tensor = torch.tensor(y_train, dtype=torch.float32)
    x_valid_tensor = torch.tensor(x_valid, dtype=torch.float32)

    model.train()
    for _epoch in range(30):
        optimizer.zero_grad()
        logits = model(x_train_tensor)
        loss = criterion(logits, y_train_tensor)
        loss.backward()
        optimizer.step()

    model.eval()
    with torch.no_grad():
        logits = model(x_valid_tensor)
        probabilities = torch.sigmoid(logits).cpu().numpy()

    importance = np.abs(model.network[0].weight.detach().cpu().numpy()).mean(axis=0)
    return (
        {
            "state_dict": model.state_dict(),
            "input_dim": x_train.shape[1],
            "importance": importance.tolist(),
        },
        compute_metrics(y_valid, probabilities),
    )


def serialize_bundle(bundle: dict[str, Any]) -> bytes:
    buffer = BytesIO()
    joblib.dump(bundle, buffer)
    buffer.seek(0)
    return buffer.read()


def train_candidates(
    dataset_id: str,
    version_ids: dict[str, str],
    df: pd.DataFrame,
    mapping: dict[str, Any],
) -> tuple[list[TrainedCandidate], list[dict[str, Any]], list[str]]:
    from .config import settings
    seed = settings.training_random_seed
    np.random.seed(seed)
    torch.manual_seed(seed)
    
    x, y, numeric_features, categorical_features = prepare_dataset(df, mapping)
    x_train, x_valid, y_train, y_valid = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=seed,
        stratify=y,
    )

    preprocessor = build_preprocessor(numeric_features, categorical_features)
    x_train_transformed = preprocessor.fit_transform(x_train)
    x_valid_transformed = preprocessor.transform(x_valid)

    if hasattr(x_train_transformed, "toarray"):
        x_train_dense = x_train_transformed.toarray()
    else:
        x_train_dense = np.asarray(x_train_transformed)

    if hasattr(x_valid_transformed, "toarray"):
        x_valid_dense = x_valid_transformed.toarray()
    else:
        x_valid_dense = np.asarray(x_valid_transformed)

    smote = SMOTE(random_state=seed)
    x_resampled, y_resampled = smote.fit_resample(x_train_dense, y_train.to_numpy())

    feature_names, feature_sources = transformed_feature_metadata(preprocessor, numeric_features, categorical_features)
    background_raw = x_train.sample(min(len(x_train), 50), random_state=42)
    background_transformed = preprocessor.transform(background_raw)
    background_dense = background_transformed.toarray() if hasattr(background_transformed, "toarray") else np.asarray(background_transformed)
    fraud_sample = x_train[numeric_features].fillna(0).sample(min(len(x_train), 1000), random_state=42).to_dict("records") if numeric_features else []

    candidates: list[TrainedCandidate] = []

    sklearn_models = {
        "logistic_regression": LogisticRegression(max_iter=500, n_jobs=None, random_state=seed),
        "random_forest": RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_leaf=5,
            random_state=seed,
            n_jobs=1,
        ),
        "xgboost": XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=seed,
            eval_metric="logloss",
            n_jobs=1,
        ),
    }

    for family, model in sklearn_models.items():
        model.fit(x_resampled, y_resampled)
        probabilities = model.predict_proba(x_valid_dense)[:, 1]
        best_threshold = find_best_threshold(y_valid.to_numpy(), probabilities)
        metrics = compute_metrics(y_valid.to_numpy(), probabilities, threshold=best_threshold)
        metrics["train_row_count"] = float(len(x_resampled))
        metrics["valid_row_count"] = float(len(x_valid))
        metrics["positive_rate_train"] = float(y_resampled.mean())
        metrics["seed"] = float(seed)
        if family == "logistic_regression":
            raw_importance = np.abs(model.coef_[0])
        else:
            raw_importance = np.asarray(model.feature_importances_)

        importance = [
            {
                "feature": feature_names[index],
                "source": feature_sources[index],
                "importance": float(raw_importance[index]),
            }
            for index in np.argsort(raw_importance)[::-1][:20].tolist()
        ]
        bundle = {
            "dataset_id": dataset_id,
            "version_id": version_ids[family],
            "model_family": family,
            "preprocessor": preprocessor,
            "model": model,
            "nn_state_dict": None,
            "nn_input_dim": None,
            "threshold": best_threshold,
            "target_column": mapping.get("targetColumn"),
            "positive_label": mapping.get("positiveLabel"),
            "feature_overrides": mapping.get("featureOverrides"),
            "transformed_feature_names": feature_names,
            "feature_sources": feature_sources,
            "numeric_features": numeric_features,
            "categorical_features": categorical_features,
            "background_raw": background_raw.to_dict("records"),
            "background_transformed": background_dense,
            "global_importance": importance,
        }
        candidates.append(
            TrainedCandidate(
                family=family,
                metrics=metrics,
                bundle_bytes=serialize_bundle(bundle),
                feature_importance=importance,
            )
        )

    nn_artifact, nn_metrics = train_mlp(x_resampled, y_resampled, x_valid_dense, y_valid.to_numpy())
    nn_raw_importance = np.asarray(nn_artifact["importance"])
    nn_importance = [
        {
            "feature": feature_names[index],
            "source": feature_sources[index],
            "importance": float(nn_raw_importance[index]),
        }
        for index in np.argsort(nn_raw_importance)[::-1][:20].tolist()
    ]
    nn_bundle = {
        "dataset_id": dataset_id,
        "version_id": version_ids["deep_mlp"],
        "model_family": "deep_mlp",
        "preprocessor": preprocessor,
        "model": None,
        "nn_state_dict": nn_artifact["state_dict"],
        "nn_input_dim": nn_artifact["input_dim"],
        "threshold": 0.5,
        "target_column": mapping.get("targetColumn"),
        "positive_label": mapping.get("positiveLabel"),
        "feature_overrides": mapping.get("featureOverrides"),
        "transformed_feature_names": feature_names,
        "feature_sources": feature_sources,
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
        "background_raw": background_raw.to_dict("records"),
        "background_transformed": background_dense,
        "global_importance": nn_importance,
    }
    candidates.append(
        TrainedCandidate(
            family="deep_mlp",
            metrics=nn_metrics,
            bundle_bytes=serialize_bundle(nn_bundle),
            feature_importance=nn_importance,
        )
    )

    return candidates, fraud_sample, numeric_features


def champion_family(candidates: list[TrainedCandidate]) -> str:
    ordered = sorted(
        candidates,
        key=lambda candidate: (candidate.metrics["rocAuc"], candidate.metrics["f1Score"]),
        reverse=True,
    )
    return ordered[0].family
