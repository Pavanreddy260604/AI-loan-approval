

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}

/**
 * SectionTitle Component
 * 
 * A standardized header for platform sections following the Elite v2 design system.
 */
export function SectionTitle({ 
  eyebrow, 
  title, 
  description, 
  className = "" 
}: SectionTitleProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {eyebrow && (
        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] font-outfit italic">
          {eyebrow}
        </span>
      )}
      <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic font-outfit">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-muted/60 max-w-2xl font-medium font-outfit uppercase tracking-wider">
          {description}
        </p>
      )}
    </div>
  );
}
