"""Shared ML model definitions for AI Loan platform.

This module contains model architectures used across multiple services
to ensure consistency between training and inference.
"""

import torch
import torch.nn as nn


class TabularMLP(nn.Module):
    """Standardized Multi-Layer Perceptron for tabular credit scoring data.

    Architecture:
        - Input Layer (input_dim)
        - Hidden Layer 1: 128 units, ReLU activation, 20% dropout
        - Hidden Layer 2: 64 units, ReLU activation, 10% dropout
        - Output Layer: 1 unit (logit)

    Note: This model outputs logits. Apply sigmoid for probabilities.

    Args:
        input_dim: Number of input features after preprocessing

    Example:
        >>> model = TabularMLP(input_dim=10)
        >>> logits = model(torch.randn(1, 10))
        >>> probs = torch.sigmoid(logits)  # Convert to probabilities
    """

    def __init__(self, input_dim: int) -> None:
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(64, 1),
        )

    def forward(self, values: torch.Tensor) -> torch.Tensor:
        """Forward pass returning logits (not probabilities).

        Args:
            values: Input tensor of shape (batch_size, input_dim)

        Returns:
            Logits tensor of shape (batch_size,)
        """
        return self.network(values).squeeze(-1)

    def predict_proba(self, values: torch.Tensor) -> torch.Tensor:
        """Convenience method that returns probabilities.

        Args:
            values: Input tensor of shape (batch_size, input_dim)

        Returns:
            Probability tensor of shape (batch_size,) in range [0, 1]
        """
        self.eval()
        with torch.no_grad():
            logits = self.forward(values)
            return torch.sigmoid(logits)


def create_mlp_for_bundle(bundle: dict) -> TabularMLP:
    """Factory function to create an MLP from a saved bundle.

    Args:
        bundle: Model bundle containing nn_input_dim and nn_state_dict

    Returns:
        Instantiated TabularMLP with loaded weights

    Raises:
        KeyError: If required keys are missing from bundle
    """
    model = TabularMLP(bundle["nn_input_dim"])
    model.load_state_dict(bundle["nn_state_dict"])
    model.eval()
    return model
