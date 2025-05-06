/**
 * Interface entity model
 */
export type Interface = {
  id: string;
  name: string;
  description: string;
  productId: string;
  features?: string[];
};