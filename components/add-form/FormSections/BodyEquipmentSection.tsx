"use client";

import { useState } from "react";
import type { ExerciseFormState } from "../types";
import { COMMON_BODY_PARTS, COMMON_EQUIPMENT } from "../types";

interface Props {
  form: ExerciseFormState;
  onChange: (patch: Partial<ExerciseFormState>) => void;
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export default function BodyEquipmentSection({ form, onChange }: Props) {
  const [customBodyPart, setCustomBodyPart] = useState("");
  const [customEquipment, setCustomEquipment] = useState("");

  const addCustomBodyPart = () => {
    const v = customBodyPart.trim().toLowerCase();
    if (v && !form.bodyParts.includes(v)) {
      onChange({ bodyParts: [...form.bodyParts, v] });
    }
    setCustomBodyPart("");
  };

  const addCustomEquipment = () => {
    const v = customEquipment.trim().toLowerCase();
    if (v && !form.equipment.includes(v)) {
      onChange({ equipment: [...form.equipment, v] });
    }
    setCustomEquipment("");
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Body and equipment</h2>

      {/* Body parts */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          Body parts <span className="text-red-500">*</span>
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {COMMON_BODY_PARTS.map((bp) => {
            const active = form.bodyParts.includes(bp);
            return (
              <button
                key={bp}
                type="button"
                onClick={() => onChange({ bodyParts: toggle(form.bodyParts, bp) })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {bp}
              </button>
            );
          })}
        </div>
        {/* Custom body parts that aren't in the common list */}
        {form.bodyParts
          .filter((bp) => !(COMMON_BODY_PARTS as readonly string[]).includes(bp))
          .map((bp) => (
            <span
              key={bp}
              className="mt-2 mr-2 inline-flex items-center gap-1 rounded-full bg-primary text-white px-3 py-1.5 text-xs font-medium"
            >
              {bp}
              <button
                type="button"
                onClick={() =>
                  onChange({ bodyParts: form.bodyParts.filter((b) => b !== bp) })
                }
                className="ml-1 hover:text-red-200"
              >
                ×
              </button>
            </span>
          ))}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={customBodyPart}
            onChange={(e) => setCustomBodyPart(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomBodyPart())}
            placeholder="Add custom body part"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={addCustomBodyPart}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Equipment */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700">
          Equipment <span className="text-xs text-gray-400">(optional)</span>
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (form.equipment.length === 0) return;
              onChange({ equipment: [] });
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              form.equipment.length === 0
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            No equipment
          </button>
          {COMMON_EQUIPMENT.map((eq) => {
            const active = form.equipment.includes(eq);
            return (
              <button
                key={eq}
                type="button"
                onClick={() => onChange({ equipment: toggle(form.equipment, eq) })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {eq}
              </button>
            );
          })}
        </div>
        {form.equipment
          .filter((eq) => !(COMMON_EQUIPMENT as readonly string[]).includes(eq))
          .map((eq) => (
            <span
              key={eq}
              className="mt-2 mr-2 inline-flex items-center gap-1 rounded-full bg-primary text-white px-3 py-1.5 text-xs font-medium"
            >
              {eq}
              <button
                type="button"
                onClick={() =>
                  onChange({ equipment: form.equipment.filter((e) => e !== eq) })
                }
                className="ml-1 hover:text-red-200"
              >
                ×
              </button>
            </span>
          ))}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={customEquipment}
            onChange={(e) => setCustomEquipment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomEquipment())}
            placeholder="Add custom equipment"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={addCustomEquipment}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </section>
  );
}
