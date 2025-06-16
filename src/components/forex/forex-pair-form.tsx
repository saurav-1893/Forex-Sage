"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// We will replace Input with Select components
// import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Import Shadcn Select components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define a list of common major forex pairs
const majorPairs = [
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AUDUSD",
  "USDCAD",
  "USDCHF",
  "NZDUSD",
  "EURGBP",
  "EURJPY",
  "GBPJPY",
  // Add more pairs as needed
];

// Define the schema for the form input
// We still validate the selected string value
const formSchema = z.object({
  pairSymbol: z.string().min(6, {
    message: "Please select a forex pair.",
  }),
});

interface ForexPairFormProps {
  onSubmit: (values: { pairSymbol: string }) => void;
  isLoading: boolean;
}

export function ForexPairForm({ onSubmit, isLoading }: ForexPairFormProps) {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pairSymbol: "", // Default to empty string or perhaps the first pair
    },
  });

  // 2. Define a submit handler.
  function handleInternalSubmit(values: z.infer<typeof formSchema>) {
    // Call the onSubmit prop passed from the parent (ForexDashboard)
    onSubmit(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Forex Pair</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleInternalSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="pairSymbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pair Symbol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a currency pair" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {majorPairs.map((pair) => (
                        <SelectItem key={pair} value={pair}>
                          {pair}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Loading..." : "Analyze Pair"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
