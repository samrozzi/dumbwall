import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  orderName: z.string().min(1, "Order/Item name is required").max(200),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  description: z.string().max(1000).optional(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

const PrivateOverrun = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderName: "",
      quantity: 1,
      description: "",
      contactEmail: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("overrun_submissions").insert({
        order_name: values.orderName,
        quantity: values.quantity,
        description: values.description || null,
        contact_email: values.contactEmail || null,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Submission received",
        description: "Your overrun report has been submitted successfully.",
      });
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Thank You!</h1>
          <p className="text-muted-foreground">
            Your overrun report has been submitted successfully.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setIsSubmitted(false);
              form.reset();
            }}
          >
            Submit Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Overrun Report</h1>
          <p className="text-muted-foreground text-sm">
            Submit details about inventory overruns
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="orderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order/Item Name or ID *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter order or item identifier" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity *</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
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
                  <FormLabel>Description / Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional details..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email (optional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-3">
                Date: {new Date().toLocaleDateString()}
              </p>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default PrivateOverrun;
