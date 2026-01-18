import { Eye, Edit2, Trash2 } from 'lucide-react'
import { CMSItem } from '@/types/cms'

interface CMSMobileCardProps {
  item: CMSItem
  onView: (item: CMSItem) => void
  onEdit: (item: CMSItem) => void
  onDelete: (item: CMSItem) => void
}

export default function CMSMobileCard({ item, onView, onEdit, onDelete }: CMSMobileCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex-1 mr-4">
           <h4 className="font-semibold text-gray-900 line-clamp-2">{item.title}</h4>
           <p className="text-xs text-gray-500 mt-1">{new Date(item.updated_at).toLocaleDateString()}</p>
        </div>
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
          item.status?.toLowerCase() === 'published' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-orange-100 text-orange-700'
        }`}>
          {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-100 pt-3">
        <div className="flex flex-col">
            <span className="text-gray-400 text-xs">Category</span>
            {item.category || '-'}
        </div>
        <div className="flex flex-col text-right">
             <span className="text-gray-400 text-xs">Views</span>
             {item.views ?? 0}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button 
            onClick={() => onView(item)}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
        >
            <Eye className="w-5 h-5" />
        </button>
        <button 
            onClick={() => onEdit(item)}
            className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
        >
            <Edit2 className="w-5 h-5" />
        </button>
        <button 
            onClick={() => onDelete(item)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
            <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
