"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FOREX_PAIRS } from "@/config/forex";
import { Search } from "lucide-react";

const ForexPairFormSchema = z.object({
  symbol: z.string().min(1, "Please select a Forex pair."),
});

type ForexPairFormValues = z.infer<typeof ForexPairFormSchema>;

interface ForexPairFormProps {
  onSubmit: (values: ForexPairFormValues) => void;
  isLoading: boolean;
}

export function ForexPairForm({ onSubmit, isLoading }: ForexPairFormProps) {
  const form = useForm<ForexPairFormValues>({
    resolver: zodResolver(ForexPairFormSchema),
    defaultValues: {
      symbol: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="symbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Forex Pair</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a pair (e.g., EUR/USD)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FOREX_PAIRS.map((pair) => (
                    <SelectItem key={pair.value} value={pair.value}>
                      {pair.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </div>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" /> Analyze Pair
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
