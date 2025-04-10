import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { createNote } from "@/lib/contractService";
import { useWalletContext } from '@/context/WalletContext';
import { Loader2, FileText, Upload } from 'lucide-react';
import { useStorageUpload } from "@thirdweb-dev/react";

interface Lecture {
  id: number;
  topic: string;
}

interface UploadNotesFormProps {
  lectures: Lecture[];
  notesContractAddress: string;
  onSuccess: () => void;
}


export function UploadNotesForm({ lectures, notesContractAddress, onSuccess }: UploadNotesFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedLectureId, setSelectedLectureId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [ipfsProgress, setIpfsProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: upload } = useStorageUpload();
  
  const { provider } = useWalletContext();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if file is a PDF
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF file',
          variant: 'destructive'
        });
        return;
      }
      
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum file size is 10MB',
          variant: 'destructive'
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setSelectedLectureId('');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !title || !description || !price || !selectedLectureId || !notesContractAddress) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all fields and select a PDF file',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Upload file to IPFS using thirdweb storage
      const uris = await upload({
        data: [file],
        onProgress: (progress) => {
          setIpfsProgress(Math.round(progress.progress * 100));
        }
      });
      
      const ipfsHash = uris[0].replace('ipfs://', ''); // Remove 'ipfs://' prefix from first URI
      
      // Create note on blockchain
      await createNote(
        notesContractAddress,
        title,
        description,
        ipfsHash,
        price,
        parseInt(selectedLectureId),
        provider
      );
      
      toast({
        title: 'Success!',
        description: 'Your notes have been uploaded and are now available for purchase',
      });
      
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error uploading notes:', error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your notes. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setIpfsProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input 
          id="title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="Enter a title for your notes"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Describe what your notes cover"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="price">Price (EDU)</Label>
        <Input 
          id="price" 
          type="number"
          min="0"
          step="0.001"
          value={price} 
          onChange={(e) => setPrice(e.target.value)} 
          placeholder="0.01"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="lecture">Associated Lecture</Label>
        <Select value={selectedLectureId} onValueChange={setSelectedLectureId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a lecture" />
          </SelectTrigger>
          <SelectContent>
            {lectures.map((lecture) => (
              <SelectItem key={lecture.id} value={lecture.id.toString()}>
                {lecture.topic}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="file">PDF File</Label>
        <div className="flex items-center gap-4">
          <Input 
            id="file" 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange} 
            accept="application/pdf"
            className="hidden"
            required
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <FileText className="mr-2 h-4 w-4" /> 
            {file ? file.name : "Select PDF file"}
          </Button>
        </div>
        {file && (
          <p className="text-sm text-green-600">
            Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
          </p>
        )}
      </div>
      
      {isUploading && ipfsProgress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${ipfsProgress}%` }}
          ></div>
          <p className="text-sm text-gray-500 mt-1">Uploading: {ipfsProgress}%</p>
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" /> Upload Notes
          </>
        )}
      </Button>
    </form>
  );
}

export default UploadNotesForm; 