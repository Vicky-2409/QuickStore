import React from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { API_ENDPOINTS } from "@/constants";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

interface ProductCardProps {
  product: Product;
  className?: string;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({
  product,
  className,
  onAddToCart,
}: ProductCardProps) {
  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <CardHeader className="p-0">
        <div className="relative aspect-square">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {product.description}
        </p>
        <p className="font-bold mt-2">${product.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full" onClick={() => onAddToCart?.(product)}>
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
