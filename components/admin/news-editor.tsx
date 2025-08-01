"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import NewsModal from "./NewsModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, MoreHorizontal, Plus, Eye, Pencil, Trash2 } from "lucide-react"
import { format } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";

// Define the NewsItem type
type NewsItem = {
  _id: string;
  title: string;
  featuredImage?: string;
  status: string;
  publishedAt: string | Date;
  views?: number;
  slug?: string;
  category?: string;
  excerpt?: string;
  content?: string;
  tags?: string[] | string;
  author?: string;
  metaTitle?: string;
  metaDescription?: string;
  isNews?: boolean;
}

// Fetch news from the API
function useNews() {
  const { toast } = useToast();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/blog?limit=100&status=all'); // Get all statuses for admin
      const data = await response.json();
      if (!data.success) throw new Error('Failed to fetch blogs');
      setNews(data.data || []);
    } catch (e: any) {
      console.error("Error fetching blog posts:", e);
      setError(e.message || "Failed to load blog posts. Please try again later.");
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteNews = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) return false;
    
    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete blog post');
      }
      
      toast({
        title: "Success",
        description: 'Blog post deleted successfully',
        variant: "default",
      });
      await fetchNews();
      return true;
    } catch (error) {
      console.error('Error deleting blog post:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete blog post',
        variant: "destructive",
      });
      return false;
    }
  };

  // Function to fetch a single blog post with all fields
  const fetchBlogPost = async (id: string): Promise<NewsItem | null> => {
    try {
      const response = await fetch(`/api/blog/${id}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch blog post');
      return data.data;
    } catch (e: any) {
      console.error("Error fetching blog post:", e);
      toast({
        title: "Error",
        description: e.message || 'Failed to load blog post',
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => { fetchNews(); }, []);

  return { 
    news, 
    loading, 
    error, 
    refresh: fetchNews, 
    deleteNews, 
    fetchBlogPost 
  };
}

export default function NewsEditor() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const { news, loading, error, refresh, deleteNews, fetchBlogPost } = useNews();
  const { toast } = useToast();
  
  const handleEdit = async (newsItem: NewsItem) => {
    if (!newsItem._id) {
      toast({
        title: "Error",
        description: "Invalid blog post ID",
        variant: "destructive",
      });
      return;
    }

    // Set loading state for this specific post
    setIsLoading(prev => ({ ...prev, [newsItem._id]: true }));
    
    try {
      // Fetch the complete blog post data
      const fullBlogPost = await fetchBlogPost(newsItem._id);
      if (fullBlogPost) {
        // Small delay to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 100));
        setEditingNews(fullBlogPost);
      }
    } catch (error) {
      console.error("Error loading blog post:", error);
      toast({
        title: "Error",
        description: "Failed to load blog post data",
        variant: "destructive",
      });
    } finally {
      // Clear loading state
      setIsLoading(prev => {
        const newState = { ...prev };
        delete newState[newsItem._id];
        return newState;
      });
    }
  };
  
  const handleDelete = async (id: string) => {
    await deleteNews(id);
  };
  
  const handleModalClose = () => {
    // Close the modal first
    setIsAddDialogOpen(false);
    
    // Then reset the editing state after a short delay
    setTimeout(() => {
      setEditingNews(null);
      refresh();
    }, 300); // Match this with your modal's close animation duration
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">News & Updates Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add News
            </Button>
          </DialogTrigger>
<>
            <NewsModal 
              open={isAddDialogOpen || !!editingNews} 
              onClose={handleModalClose}
              onCreated={() => {
                refresh();
                setEditingNews(null);
              }}
              initialData={editingNews || undefined}
              key={editingNews?._id || 'new'}
            />
            {Object.keys(isLoading).map(postId => (
              <div key={`loading-${postId}`} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-2" />
                  <p>Loading blog post data...</p>
                </div>
              </div>
            ))}
          </>
        </Dialog>
      </div>

      <div className="rounded-md border">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p>Loading news...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="rounded-md bg-destructive/10 p-4 text-destructive">
              <p className="font-medium">Error loading news</p>
              <p className="text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => refresh()}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : !news || news.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No blog posts found.</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add your first article
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {news.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No news posts found. Create your first post!
                  </TableCell>
                </TableRow>
              ) : (
                news.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {item.featuredImage && (
                          <img 
                            src={item.featuredImage} 
                            alt={item.title}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        )}
                        <span className="line-clamp-1">{item.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          item.status === 'published' ? 'default' : 
                          item.status === 'draft' ? 'outline' : 'secondary'
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {format(new Date(item.publishedAt), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {item.views?.toLocaleString() || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => window.open(`/blog/${item.slug || item._id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

