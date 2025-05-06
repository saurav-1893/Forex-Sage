"use client";

import React, { useState } from 'react';
import { useStrategyManager } from '@/hooks/use-strategy-manager';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TradingStrategySchema, type TradingStrategy } from '@/types/strategy';
import { PlusCircle, Edit2, Trash2, BrainCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { llmChat } from '@/ai/flows/llm-chat-feature'; // For AI assistance

type StrategyFormData = Omit<TradingStrategy, 'id'>;

interface StrategyManagerProps {
  selectedStrategyId: string | null;
  onStrategyChange: (id: string | null) => void;
  disabled?: boolean;
}

export function StrategyManager({ selectedStrategyId, onStrategyChange, disabled }: StrategyManagerProps) {
  const { strategies, addStrategy, updateStrategy, deleteStrategy, isStrategyManagerInitialized } = useStrategyManager();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<TradingStrategy | null>(null);
  const [isAiAssisting, setIsAiAssisting] = useState(false);
  const { toast } = useToast();

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<StrategyFormData>({
    resolver: zodResolver(TradingStrategySchema.omit({ id: true })),
    defaultValues: {
      name: '',
      description: '',
      rules: '',
    },
  });

  const handleOpenDialog = (strategy?: TradingStrategy) => {
    if (strategy) {
      setEditingStrategy(strategy);
      reset({ name: strategy.name, description: strategy.description || '', rules: strategy.rules });
    } else {
      setEditingStrategy(null);
      reset({ name: '', description: '', rules: '' });
    }
    setIsDialogOpen(true);
  };

  const onSubmit: SubmitHandler<StrategyFormData> = (data) => {
    if (editingStrategy) {
      updateStrategy({ ...editingStrategy, ...data });
      toast({ title: 'Strategy Updated', description: `Strategy "${data.name}" has been updated.` });
    } else {
      addStrategy(data);
      toast({ title: 'Strategy Added', description: `New strategy "${data.name}" has been added.` });
    }
    setIsDialogOpen(false);
  };

  const handleDeleteStrategy = (strategyId: string) => {
    const strategyToWarn = strategies.find(s => s.id === strategyId);
    if (window.confirm(`Are you sure you want to delete the strategy "${strategyToWarn?.name}"?`)) {
      deleteStrategy(strategyId);
      toast({ title: 'Strategy Deleted', description: `Strategy "${strategyToWarn?.name}" has been deleted.`, variant: 'destructive' });
    }
  };

  const handleAiAssist = async () => {
    setIsAiAssisting(true);
    toast({ title: "AI Assistant", description: "Thinking about strategy rules..." });
    try {
      const strategyName = control._getWatch('name') || "a new trading strategy";
      const strategyDescription = control._getWatch('description') || "as described";
      
      const prompt = `Generate detailed trading rules for a forex strategy named "${strategyName}".
      Description: "${strategyDescription}".
      The rules should be actionable and cover entry conditions, exit conditions (stop loss, take profit), and any relevant indicators or chart patterns.
      The output should ONLY be the rules text, suitable for direct use in a trading system. Be concise but comprehensive. Example:
      "BUY when 10-period SMA crosses above 30-period SMA and RSI(14) > 50. SELL when 10-SMA crosses below 30-SMA and RSI(14) < 50. Stop Loss: 20 pips. Take Profit: 40 pips."`;

      const response = await llmChat({ modelName: 'gemini', message: prompt }); // Assuming a default model for assistance
      if (response && response.response) {
        setValue('rules', response.response, { shouldValidate: true });
        toast({ title: "AI Assistant", description: "Strategy rules generated!" });
      } else {
        toast({ variant: "destructive", title: "AI Assistant Error", description: "Could not generate rules." });
      }
    } catch (error) {
      console.error("AI assistance error:", error);
      toast({ variant: "destructive", title: "AI Assistant Error", description: "An error occurred while generating rules." });
    } finally {
      setIsAiAssisting(false);
    }
  };
  
  if (!isStrategyManagerInitialized) {
    return <p>Loading strategies...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="strategy-select" className="text-sm font-medium">Trading Strategy</Label>
        <Select
          value={selectedStrategyId || ''}
          onValueChange={(value) => onStrategyChange(value || null)}
          disabled={disabled || strategies.length === 0}
        >
          <SelectTrigger id="strategy-select" className="flex-grow">
            <SelectValue placeholder="Select a strategy" />
          </SelectTrigger>
          <SelectContent>
            {strategies.map((strategy) => (
              <SelectItem key={strategy.id} value={strategy.id}>
                {strategy.name}
              </SelectItem>
            ))}
            {strategies.length === 0 && <SelectItem value="" disabled>No strategies available</SelectItem>}
          </SelectContent>
        </Select>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => handleOpenDialog()} title="Add New Strategy" disabled={disabled}>
              <PlusCircle className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          {selectedStrategyId && strategies.find(s => s.id === selectedStrategyId) && (
            <>
              <Button variant="outline" size="icon" onClick={() => handleOpenDialog(strategies.find(s => s.id === selectedStrategyId))} title="Edit Selected Strategy" disabled={disabled}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={() => handleDeleteStrategy(selectedStrategyId)} title="Delete Selected Strategy" disabled={disabled}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingStrategy ? 'Edit Strategy' : 'Add New Strategy'}</DialogTitle>
              <DialogDescription>
                {editingStrategy ? 'Modify the details of your trading strategy.' : 'Create a new custom trading strategy.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Strategy Name</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input id="name" {...field} />}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => <Input id="description" {...field} />}
                />
                 {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="rules">Strategy Rules</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAiAssist} disabled={isAiAssisting}>
                    <BrainCog className="mr-2 h-4 w-4" />
                    {isAiAssisting ? "Generating..." : "AI Assist"}
                  </Button>
                </div>
                <Controller
                  name="rules"
                  control={control}
                  render={({ field }) => <Textarea id="rules" {...field} rows={6} placeholder="Define the entry, exit, stop loss, and take profit conditions. E.g., BUY when 10-SMA crosses above 30-SMA..." />}
                />
                {errors.rules && <p className="text-sm text-destructive">{errors.rules.message}</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">{editingStrategy ? 'Save Changes' : 'Add Strategy'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
