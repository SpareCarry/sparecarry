/**
 * Basic Section Component
 * 
 * Handles title, description, category, and photo upload
 */

"use client";

import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { PhotoUploader } from "../../../modules/tier1Features/photos";
import { ItemTemplateSelector } from "../item-template-selector";
import type { ItemTemplate } from "../../../lib/data/item-templates";
import type { BasicSectionProps } from "./types";
import { ITEM_CATEGORIES, type Category } from "../../../lib/utils/categories";

export function BasicSection({
  register,
  errors,
  watch,
  showTemplateSelector,
  onShowTemplateSelector,
  photos,
  onPhotosChange,
  loading,
  onTemplateSelect,
}: BasicSectionProps) {
  const title = watch("title");
  const description = watch("description");
  const category = watch("category");
  const categoryOtherDescription = watch("category_other_description");

  return (
    <>
      {/* Quick Select Template Button */}
      <div className="flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 p-4">
        <div>
          <p className="font-medium text-teal-900">
            Quick Select Common Boat Item
          </p>
          <p className="text-sm text-teal-700">
            Choose from pre-filled templates for batteries, anchors, sails, and
            more. Specs will be auto-filled!
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onShowTemplateSelector}
          className="border-teal-300 bg-white text-teal-700 hover:bg-teal-100"
        >
          Browse Templates
        </Button>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Item Title *</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="e.g., Marine Battery 200Ah"
          className="bg-white"
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        {errors.title && (
          <p id="title-error" className="text-sm text-red-600" role="alert">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          {...register("description")}
          rows={4}
          className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Describe your item..."
          aria-describedby={errors.description ? "description-error" : undefined}
        />
        {errors.description && (
          <p id="description-error" className="text-sm text-red-600" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Photos - Enhanced Tier-1 Photo Uploader */}
      <PhotoUploader
        photos={photos}
        onPhotosChange={(newPhotos) =>
          onPhotosChange(newPhotos.filter((p): p is File => p instanceof File))
        }
        minPhotos={3}
        maxPhotos={6}
        disabled={loading}
      />

      {/* Category Selection */}
      <div className="space-y-2">
        <Label htmlFor="category">Category (Optional)</Label>
        <select
          id="category"
          {...register("category")}
          className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-describedby={errors.category ? "category-error" : undefined}
        >
          <option value="">Select a category...</option>
          {ITEM_CATEGORIES.map((cat: Category) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p id="category-error" className="text-sm text-red-600" role="alert">
            {errors.category.message}
          </p>
        )}
      </div>

      {/* Category Other Description */}
      {category === "other" && (
        <div className="space-y-2">
          <Label htmlFor="category_other_description">
            Please describe the category
          </Label>
          <Input
            id="category_other_description"
            {...register("category_other_description")}
            placeholder="Describe the item category..."
            className="bg-white"
            aria-describedby={errors.category_other_description ? "category-other-error" : undefined}
          />
          {errors.category_other_description && (
            <p id="category-other-error" className="text-sm text-red-600" role="alert">
              {errors.category_other_description.message}
            </p>
          )}
        </div>
      )}

      {/* Item Template Selector */}
      <ItemTemplateSelector
        open={showTemplateSelector}
        onClose={() => onShowTemplateSelector()}
        onSelectTemplate={onTemplateSelect}
      />
    </>
  );
}

