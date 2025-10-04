import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Search,
  File,
  Folder,
  Download,
  Share2,
  Trash2,
  Eye,
  Filter,
  FileText,
  Image as ImageIcon,
  FileVideo,
  FileArchive,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const Documents = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("/");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Mock data - replace with real data from Supabase
  const documents = [
    {
      id: "1",
      name: "Sales_Proposal_Q4_2025.pdf",
      description: "Annual sales proposal for Q4",
      file_type: "application/pdf",
      file_size: 2456789,
      folder_path: "/Sales",
      related_to_type: "quote",
      tags: ["sales", "proposal", "q4"],
      is_shared: true,
      version: 2,
      created_at: "2025-09-15T10:30:00Z",
      created_by_name: "John Doe",
    },
    {
      id: "2",
      name: "Client_Contract_ABC.docx",
      description: "Contract with ABC Corporation",
      file_type: "application/docx",
      file_size: 1234567,
      folder_path: "/Contracts",
      related_to_type: "account",
      tags: ["contract", "legal"],
      is_shared: false,
      version: 1,
      created_at: "2025-09-10T14:20:00Z",
      created_by_name: "Jane Smith",
    },
    {
      id: "3",
      name: "Product_Catalog_2025.xlsx",
      description: "Complete product catalog",
      file_type: "application/xlsx",
      file_size: 567890,
      folder_path: "/Products",
      related_to_type: null,
      tags: ["products", "catalog"],
      is_shared: true,
      version: 3,
      created_at: "2025-08-25T09:15:00Z",
      created_by_name: "Mike Johnson",
    },
  ];

  const folders = [
    { path: "/", name: "Root", count: 15 },
    { path: "/Sales", name: "Sales", count: 8 },
    { path: "/Contracts", name: "Contracts", count: 12 },
    { path: "/Products", name: "Products", count: 5 },
    { path: "/Marketing", name: "Marketing", count: 20 },
  ];

  const stats = [
    { label: "Total Documents", value: "245", icon: File },
    { label: "Shared Files", value: "89", icon: Share2 },
    { label: "Storage Used", value: "15.6 GB", icon: FileArchive },
    { label: "This Month", value: "+34", icon: Upload },
  ];

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes("image")) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (fileType.includes("video")) return <FileVideo className="h-5 w-5 text-purple-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleUpload = () => {
    toast({
      title: "Document uploaded",
      description: "Your document has been uploaded successfully",
    });
    setUploadDialogOpen(false);
  };

  const handleDownload = (docName: string) => {
    toast({
      title: "Download started",
      description: `Downloading ${docName}`,
    });
  };

  const handleShare = (docName: string) => {
    toast({
      title: "Document shared",
      description: `${docName} has been shared`,
    });
  };

  const handleDelete = (docName: string) => {
    toast({
      title: "Document deleted",
      description: `${docName} has been deleted`,
      variant: "destructive",
    });
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Document Management</h1>
            <p className="text-muted-foreground mt-1">
              Upload, organize, and manage your business documents
            </p>
          </div>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload New Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>File</Label>
                  <Input type="file" />
                </div>
                <div className="space-y-2">
                  <Label>Document Name</Label>
                  <Input placeholder="Enter document name" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Enter document description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Folder</Label>
                    <Select defaultValue="/">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {folders.map((folder) => (
                          <SelectItem key={folder.path} value={folder.path}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Related To</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contact">Contact</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="deal">Deal</SelectItem>
                        <SelectItem value="quote">Quote</SelectItem>
                        <SelectItem value="invoice">Invoice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma separated)</Label>
                  <Input placeholder="e.g., sales, contract, proposal" />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="shared" className="rounded" />
                  <Label htmlFor="shared">Make this document shared</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload}>Upload Document</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon className="h-8 w-8 text-primary" />
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="documents" className="space-y-4">
          <TabsList>
            <TabsTrigger value="documents">All Documents</TabsTrigger>
            <TabsTrigger value="folders">Folders</TabsTrigger>
            <TabsTrigger value="shared">Shared with Me</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            {/* Search and Filters */}
            <Card className="p-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                  <SelectTrigger className="w-48">
                    <Folder className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((folder) => (
                      <SelectItem key={folder.path} value={folder.path}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </Card>

            {/* Documents Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Folder</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(doc.file_type)}
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            {doc.description && (
                              <p className="text-xs text-muted-foreground">
                                {doc.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {doc.file_type.split("/")[1].toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Folder className="h-3 w-3" />
                          {doc.folder_path}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>v{doc.version}</TableCell>
                      <TableCell>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{doc.created_by_name}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(doc.name)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare(doc.name)}>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(doc.name)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="folders" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {folders.map((folder) => (
                <Card
                  key={folder.path}
                  className="p-6 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setSelectedFolder(folder.path)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Folder className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-semibold">{folder.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {folder.count} files
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="shared">
            <Card className="p-8 text-center">
              <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Documents shared with you will appear here
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="recent">
            <Card className="p-8 text-center">
              <File className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Your recently accessed documents will appear here
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Documents;
