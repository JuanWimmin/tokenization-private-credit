"use client";

import type { UseFormReturn } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@tokenization/ui/form";
import { Input } from "@tokenization/ui/input";
import { Textarea } from "@tokenization/ui/textarea";
import type { CreateCampaignFormValues } from "@/features/campaigns/types/campaign.types";

interface Props {
  form: UseFormReturn<CreateCampaignFormValues>;
}

export function StepCampaignBasics({ form }: Props) {
  return (
    <Form {...form}>
      <div className="flex flex-col gap-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nombre de la Campaña
                <span className="text-destructive ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="ej. Micro-Préstamos para Mujeres Emprendedoras"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Descripción
                <span className="text-destructive ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe brevemente el propósito de este fondo..."
                  className="resize-none min-h-28"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tokenName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nombre del Token
                <span className="text-destructive ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="ej. AgriGrowth Bond" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="poolSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Pool Size (USD)
                  <span className="text-destructive ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="100000"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="loanSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Tamaño del Préstamo (USD)
                  <span className="text-destructive ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="50000"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="loanDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Duración del Préstamo (meses)
                  <span className="text-destructive ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="12"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expectedReturn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Retorno Esperado (%)
                  <span className="text-destructive ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="8.5"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </Form>
  );
}
