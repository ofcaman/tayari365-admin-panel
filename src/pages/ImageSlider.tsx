import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { toast } from 'sonner';
import { Plus, Trash2, Upload, Edit } from 'lucide-react';

interface SliderImage {
  id: string;
  url: string;
  title: string;
  link?: string;
}

export default function ImageSlider() {
  const [images, setImages] = useState<SliderImage[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<SliderImage | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    const snapshot = await getDocs(collection(db, 'sliderImages'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SliderImage));
    setImages(data);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    setUploading(true);
    try {
      if (editingImage) {
        // Update existing image
        const updateData: any = { title, link: link || '' };
        
        if (file) {
          const storageRef = ref(storage, `slider/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          updateData.url = url;
        }

        await updateDoc(doc(db, 'sliderImages', editingImage.id), updateData);
        toast.success('Image updated successfully');
      } else {
        // Add new image
        if (!file) return;
        
        const storageRef = ref(storage, `slider/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        await addDoc(collection(db, 'sliderImages'), { url, title, link: link || '' });
        toast.success('Image uploaded successfully');
      }
      
      setOpen(false);
      setTitle('');
      setLink('');
      setFile(null);
      setEditingImage(null);
      fetchImages();
    } catch (error) {
      toast.error(editingImage ? 'Failed to update image' : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (image: SliderImage) => {
    setEditingImage(image);
    setTitle(image.title);
    setLink(image.link || '');
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'sliderImages', id));
      toast.success('Image deleted successfully');
      fetchImages();
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Image Slider</h1>
            <p className="text-muted-foreground">Manage homepage slider images</p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditingImage(null);
              setTitle('');
              setLink('');
              setFile(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Image
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingImage ? 'Update' : 'Upload'} Slider Image</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link">Link (Optional)</Label>
                  <Input
                    id="link"
                    type="url"
                    placeholder="https://example.com"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Image File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required={!editingImage}
                  />
                  {editingImage && <p className="text-xs text-muted-foreground">Leave empty to keep current image</p>}
                </div>
                <Button type="submit" className="w-full" disabled={uploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? (editingImage ? 'Updating...' : 'Uploading...') : (editingImage ? 'Update' : 'Upload')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <Card key={image.id}>
              <CardHeader>
                <CardTitle className="text-lg">{image.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(image)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(image.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
