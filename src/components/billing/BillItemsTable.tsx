import React from 'react';
import { BillItem, ItemType } from '../../types';
import { Plus, Trash2, Tag } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';

interface BillItemsTableProps {
  items: BillItem[];
  onChange: (items: BillItem[]) => void;
}

const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: 'frame', label: 'Frame / Spectacle' },
  { value: 'lens', label: 'Lenses (Pair)' },
  { value: 'contact_lens', label: 'Contact Lens' },
  { value: 'sunglasses', label: 'Sunglasses' },
  { value: 'solution', label: 'Cleaning Solution' },
  { value: 'accessories', label: 'Case / Cloth / Chain' },
  { value: 'service', label: 'Repair / Fitting Service' },
  { value: 'other', label: 'Other Product' },
];

export const BillItemsTable: React.FC<BillItemsTableProps> = ({ items, onChange }) => {
  const handleAddItem = (presetType?: ItemType) => {
    const newItem: BillItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      item_type: presetType || 'frame',
      product_name: presetType === 'lens' ? 'Single Vision Anti-Glare Lens' : 'Optical Frame',
      brand: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      total_price: 0,
    };
    onChange([...items, newItem]);
  };

  const handleUpdateItem = (index: number, updates: Partial<BillItem>) => {
    const updated = [...items];
    const current = { ...updated[index], ...updates };

    const qty = Math.max(1, Number(current.quantity) || 1);
    const unitPrice = Math.max(0, Number(current.unit_price) || 0);
    const discount = Math.max(0, Number(current.discount) || 0);

    current.quantity = qty;
    current.unit_price = unitPrice;
    current.discount = discount;
    current.total_price = Math.max(0, qty * unitPrice - discount);

    updated[index] = current;
    onChange(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-brand-600" />
          <span>Optical Products & Services</span>
        </h4>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddItem('lens')}
            className="text-xs py-1"
          >
            + Add Lens
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddItem()}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs py-1"
          >
            Add Item
          </Button>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/75 text-slate-700 font-semibold border-b border-slate-200">
              <th className="p-2.5 w-32">Type</th>
              <th className="p-2.5 min-w-[200px]">Product / Model Description</th>
              <th className="p-2.5 w-28">Brand</th>
              <th className="p-2.5 w-16 text-center">Qty</th>
              <th className="p-2.5 w-24 text-right">Price (₹)</th>
              <th className="p-2.5 w-20 text-right">Disc (₹)</th>
              <th className="p-2.5 w-28 text-right">Total (₹)</th>
              <th className="p-2.5 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-2">
                  <select
                    value={item.item_type}
                    onChange={(e) =>
                      handleUpdateItem(index, { item_type: e.target.value as ItemType })
                    }
                    className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white focus:border-brand-500 focus:outline-none"
                  >
                    {ITEM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ray-Ban Matte Black TR90"
                    value={item.product_name}
                    onChange={(e) => handleUpdateItem(index, { product_name: e.target.value })}
                    className="w-full rounded border border-slate-300 p-1.5 text-xs focus:border-brand-500 focus:outline-none"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    placeholder="e.g. Ray-Ban / Zeiss"
                    value={item.brand || ''}
                    onChange={(e) => handleUpdateItem(index, { brand: e.target.value })}
                    className="w-full rounded border border-slate-300 p-1.5 text-xs focus:border-brand-500 focus:outline-none"
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleUpdateItem(index, { quantity: parseInt(e.target.value) || 1 })
                    }
                    className="w-14 rounded border border-slate-300 p-1.5 text-xs text-center font-mono focus:border-brand-500 focus:outline-none"
                  />
                </td>
                <td className="p-2 text-right">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={item.unit_price === 0 ? '' : item.unit_price}
                    onChange={(e) =>
                      handleUpdateItem(index, { unit_price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-24 rounded border border-slate-300 p-1.5 text-xs text-right font-mono focus:border-brand-500 focus:outline-none"
                  />
                </td>
                <td className="p-2 text-right">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={item.discount === 0 ? '' : item.discount}
                    onChange={(e) =>
                      handleUpdateItem(index, { discount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-20 rounded border border-slate-300 p-1.5 text-xs text-right font-mono focus:border-brand-500 focus:outline-none"
                  />
                </td>
                <td className="p-2 text-right font-mono font-bold text-slate-900">
                  {formatCurrency(item.total_price)}
                </td>
                <td className="p-2 text-center">
                  <button
                    type="button"
                    disabled={items.length <= 1}
                    onClick={() => handleRemoveItem(index)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
