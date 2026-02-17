interface Instruction {
  stepNumber: number;
  description: string;
}

interface InstructionsSectionProps {
  instructions: Instruction[];
}

export default function InstructionsSection({ instructions }: InstructionsSectionProps) {
  if (!instructions || instructions.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Instructions</h2>
      <ol className="space-y-4">
        {instructions.map((step) => (
          <li key={step.stepNumber} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {step.stepNumber}
            </span>
            <p className="pt-1 text-sm leading-relaxed text-gray-700">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
