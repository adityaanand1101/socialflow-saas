import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Upload, 
  FolderPlus, 
  Grid, 
  List, 
  Filter,
  MoreVertical,
  Image as ImageIcon,
  Video,
  FileText
} from 'lucide-react'

const mediaItems = [
  { id: '1', type: 'image', name: 'Product_01.jpg', size: '2.4 MB', date: '2h ago', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400' },
  { id: '2', type: 'image', name: 'Team_Photo.png', size: '4.8 MB', date: '5h ago', url: 'https://images.unsplash.com/photo-1454165833767-131f3696773a?w=400' },
  { id: '3', type: 'video', name: 'Promo_Video.mp4', size: '45.2 MB', date: 'Yesterday', url: '' },
  { id: '4', type: 'image', name: 'Banner_v2.jpg', size: '1.2 MB', date: '2 days ago', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400' },
  { id: '5', type: 'file', name: 'Campaign_Brief.pdf', size: '0.5 MB', date: '3 days ago', url: '' },
  { id: '6', type: 'image', name: 'Asset_7.png', size: '3.1 MB', date: '1 week ago', url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400' },
]

export const MediaLibrary = () => {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Media Library</h1>
          <p className="text-muted-foreground mt-1">Manage all your visual assets in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <FolderPlus className="w-4 h-4" />
            New Folder
          </Button>
          <Button className="gap-2">
            <Upload className="w-4 h-4" />
            Upload Asset
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search files..." className="pl-10 bg-transparent border-none" />
        </div>
        <div className="flex items-center gap-2 border-l border-white/10 pl-4 w-full md:w-auto">
          <Button variant="ghost" size="icon" className="text-white bg-white/10"><Grid className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground"><List className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground"><Filter className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {mediaItems.map((item) => (
          <Card key={item.id} className="group relative overflow-hidden bg-white/5 hover:border-white/20 transition-all">
            <div className="aspect-square relative overflow-hidden bg-navy-800 flex items-center justify-center">
              {item.type === 'image' ? (
                <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              ) : item.type === 'video' ? (
                <Video className="w-8 h-8 text-muted-foreground" />
              ) : (
                <FileText className="w-8 h-8 text-muted-foreground" />
              )}
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white"><ImageIcon className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white"><MoreVertical className="w-4 h-4" /></Button>
              </div>

              {item.type === 'video' && (
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white">
                  0:45
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-xs font-medium text-white truncate">{item.name}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">{item.size}</span>
                <span className="text-[10px] text-muted-foreground">{item.date}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Storage Usage indicator */}
      <div className="mt-8 p-4 glass-card rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-white uppercase tracking-widest">Storage Usage</p>
          <p className="text-xs text-muted-foreground">3.2 GB / 10 GB (32%)</p>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-primary w-[32%] rounded-full shadow-glow" />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 italic text-center">
          Powered by Backblaze B2 Storage
        </p>
      </div>
    </div>
  )
}
