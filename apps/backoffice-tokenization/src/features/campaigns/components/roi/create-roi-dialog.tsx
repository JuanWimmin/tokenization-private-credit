"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@tokenization/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@tokenization/ui/form";
import { Input } from "@tokenization/ui/input";
import { Button } from "@tokenization/ui/button";
import { ArrowRight, Info } from "lucide-react";
import { numericInputKeyDown, parseNumericInput } from "@/lib/numeric-input";
import type { CreateRoiDialogProps, RoiFormValues } from "./types";

export function CreateRoiDialog({
  campaign,
  form,
  onClose,
  onSubmit,
}: CreateRoiDialogProps) {
  return (
    <Dialog open={!!campaign} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear ROI</DialogTitle>
          <DialogDescription>
            Establezca el multiplicador para el seguimiento del rendimiento de
            sus activos.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <FormField
              control={form.control}
              name="roiPercentage"
              rules={{
                required: "El precio es obligatorio",
                min: { value: 0, message: "Debe ser mayor o igual a 0" },
                max: { value: 100, message: "No puede ser mayor a 100%" },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio (%)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        className="pr-7"
                        {...field}
                        onKeyDown={numericInputKeyDown}
                        onChange={(e) => field.onChange(parseNumericInput(e.target.value, 100))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                        %
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Info box */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3">
              <Info className="size-5 text-primary shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-foreground">
                  Cómo funciona
                </span>
                <p className="text-sm text-text-secondary leading-relaxed">
                  El multiplicador ajusta el seguimiento en tiempo real
                  basándose en el porcentaje de precio establecido para
                  optimizar el rendimiento de sus activos en el Vault.
                </p>
                <button
                  type="button"
                  className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors text-left w-fit cursor-pointer"
                >
                  Leer más →
                </button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button type="submit" className="cursor-pointer gap-1.5">
                Crear Vault
                <ArrowRight className="size-4" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
