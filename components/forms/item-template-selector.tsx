"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  ITEM_TEMPLATES,
  getTemplatesByCategory,
  searchTemplates,
  getTemplateCategories,
  type ItemTemplate,
} from "../../lib/data/item-templates";
import { getCategoryLabel } from "../../lib/utils/categories";
import { detectItemSpecs } from "../../lib/utils/weight-estimation";
import { Search, Package } from "lucide-react";

interface ItemTemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ItemTemplate, specs: {
    weight: number;
    dimensions: { length: number; width: number; height: number };
  } | null) => void;
}

export function ItemTemplateSelector({
  open,
  onClose,
  onSelectTemplate,
}: ItemTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get all unique categories from templates
  const categories = useMemo(() => getTemplateCategories(), []);

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    let templates = ITEM_TEMPLATES;

    // Filter by category first
    if (selectedCategory) {
      templates = getTemplatesByCategory(selectedCategory);
    }

    // Then filter by search query
    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery).filter((t) =>
        selectedCategory ? t.category === selectedCategory : true
      );
    }

    return templates;
  }, [searchQuery, selectedCategory]);

  // Group templates by category for display
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, ItemTemplate[]> = {};
    filteredTemplates.forEach((template) => {
      if (!groups[template.category]) {
        groups[template.category] = [];
      }
      groups[template.category].push(template);
    });
    return groups;
  }, [filteredTemplates]);

  const handleSelectTemplate = (template: ItemTemplate) => {
    // Use detectItemSpecs to get weight and dimensions
    const specs = detectItemSpecs(
      template.title,
      template.description,
      template.category
    );

    onSelectTemplate(template, specs || null);
    onClose();
    setSearchQuery("");
    setSelectedCategory(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Quick Select Item Template</DialogTitle>
          <DialogDescription>
            Choose a template to auto-fill your item details. Templates focus on
            common boat items where specs can be automatically estimated.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search items... (e.g., battery, anchor, sail)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {getCategoryLabel(category)}
              </Button>
            ))}
          </div>

          {/* Templates List */}
          <div className="flex-1 overflow-y-auto border rounded-lg p-4">
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-500">
                  {searchQuery
                    ? "No templates found matching your search."
                    : "No templates available in this category."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedTemplates).map(([category, templates]) => (
                  <div key={category}>
                    <h3 className="mb-3 text-sm font-semibold text-slate-700">
                      {getCategoryLabel(category)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {templates.map((template) => {
                        const specs = detectItemSpecs(
                          template.title,
                          template.description,
                          template.category
                        );

                        return (
                          <Card
                            key={template.id}
                            className="cursor-pointer transition-all hover:border-teal-400 hover:shadow-md"
                            onClick={() => handleSelectTemplate(template)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-slate-900 mb-1">
                                    {template.title}
                                  </h4>
                                  <p className="text-xs text-slate-600 mb-2">
                                    {template.description}
                                  </p>
                                  {specs && (
                                    <div className="text-xs text-slate-500 space-y-1">
                                      <div>
                                        Weight: ~{specs.weight.toFixed(1)}kg
                                      </div>
                                      <div>
                                        Size: {specs.dimensions.length} ×{" "}
                                        {specs.dimensions.width} ×{" "}
                                        {specs.dimensions.height} cm
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectTemplate(template);
                                  }}
                                >
                                  Use
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

