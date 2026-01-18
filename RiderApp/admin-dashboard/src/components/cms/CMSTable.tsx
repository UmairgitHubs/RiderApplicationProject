import { Eye, Edit2, Trash2 } from 'lucide-react'
import { CMSItem } from '@/types/cms'

interface CMSTableProps {
  items: CMSItem[]
  onView: (item: CMSItem) => void
  onEdit: (item: CMSItem) => void
  onDelete: (item: CMSItem) => void
}

export default function CMSTable({ items, onView, onEdit, onDelete }: CMSTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden md:block">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
          <tr>
            <th className="px-6 py-4">Question / Title</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Views</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Last Updated</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 align-top max-w-[300px]">
                <div className="font-medium text-gray-900 line-clamp-2">{item.title}</div>
                {item.content && <div className="text-xs text-gray-500 mt-1 line-clamp-1">{item.content}</div>}
              </td>
              <td className="px-6 py-4 align-top">
                {item.category && (
                  <span className="inline-flex px-2.5 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium">
                    {item.category}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 align-top text-gray-900">
                {item.views ?? 0}
              </td>
              <td className="px-6 py-4 align-top">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  item.status?.toLowerCase() === 'published' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                </span>
              </td>
              <td className="px-6 py-4 align-top text-gray-500">
                {new Date(item.updated_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 align-top text-right">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => onView(item)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onEdit(item)}
                    className="p-1.5 text-green-500 hover:bg-green-50 rounded-md transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDelete(item)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
