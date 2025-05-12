"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AttachmentDialogProps } from "@/types/models";
import { Loader2 } from "lucide-react";

// Form schema with zod validation
const formSchema = z.object({
  url: z.string()
    .url({ message: "Please enter a valid URL" })
    .min(1, { message: "URL is required" }),
  title: z.string().optional(),
});

// Type for form values
type AttachmentFormValues = z.infer<typeof formSchema>;

/**
 * Dialog component for adding a new attachment
 */
export function AttachmentDialog({
  open,
  onOpenChange,
  onAdd,
  isLoading = false
}: AttachmentDialogProps) {
  // Initialize form with react-hook-form and zod validation
  const form = useForm<AttachmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      title: "",
    },
  });

  // Handle form submission
  async function onSubmit(values: AttachmentFormValues) {
    try {
      await onAdd(values.url, values.title);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation
      console.error("Error adding attachment:", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Attachment</DialogTitle>
          <DialogDescription>
            Add a link to an external resource or file.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://..." 
                      {...field} 
                      autoFocus 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Descriptive title" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Attachment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}