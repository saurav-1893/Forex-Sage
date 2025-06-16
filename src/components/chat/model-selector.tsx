"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LLM_MODELS, type LlmModelValue } from "@/config/forex";

interface ModelSelectorProps {
  selectedModel: LlmModelValue;
  onModelChange: (model: LlmModelValue) => void;
  disabled?: boolean;
}

export function ModelSelector({ selectedModel, onModelChange, disabled }: ModelSelectorProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="llm-model-select">Select AI Model</Label>
      <Select 
        value={selectedModel} 
        onValueChange={(value) => onModelChange(value as LlmModelValue)}
        disabled={disabled}
      >
        <SelectTrigger id="llm-model-select" className="w-full">
          <SelectValue placeholder="Choose an AI model" />
        </SelectTrigger>
        <SelectContent>
          {LLM_MODELS.map((model) => (
            <SelectItem key={model.value} value={model.value}>
              {model.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
