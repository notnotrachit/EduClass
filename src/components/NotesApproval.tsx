import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  getAllNotes,
  getNoteDetails,
  approveNote
} from "@/lib/contractService";
import { useWalletContext } from '@/context/WalletContext';
import { FileText, Download, Tag, User, Calendar, Loader2, BookOpen, CheckCircle, XCircle } from 'lucide-react';

interface NotesApprovalProps {
  notesContractAddress: string;
}

interface NoteDetails {
  id: number;
  title: string;
  description: string;
  ipfsHash: string;
  creator: string;
  price: string;
  createdAt: number;
  lectureId: number;
  isApproved: boolean;
  salesCount: number;
}

export function NotesApproval({ notesContractAddress }: NotesApprovalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<NoteDetails[]>([]);
  const [processing, setProcessing] = useState<Record<number, boolean>>({});
  
  const { provider } = useWalletContext();
  const { toast } = useToast();

  useEffect(() => {
    if (notesContractAddress) {
      fetchNotes();
    }
  }, [notesContractAddress]);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      
      // Get all notes
      const noteIds = await getAllNotes(notesContractAddress, provider);
      
      // Get details for each note
      const notesData = await Promise.all(
        noteIds.map(async (id) => {
          const details = await getNoteDetails(notesContractAddress, id, provider);
          return details;
        })
      );
      
      setNotes(notesData);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notes. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (note: NoteDetails, approved: boolean) => {
    try {
      setProcessing(prev => ({ ...prev, [note.id]: true }));
      
      await approveNote(
        notesContractAddress,
        note.id,
        approved,
        provider
      );
      
      toast({
        title: approved ? 'Note Approved' : 'Note Rejected',
        description: `The note "${note.title}" has been ${approved ? 'approved' : 'rejected'}.`,
      });
      
      // Update the note in the UI
      setNotes(prev => prev.map(n => 
        n.id === note.id ? { ...n, isApproved: approved } : n
      ));
    } catch (error) {
      console.error('Error updating note approval:', error);
      toast({
        title: 'Update failed',
        description: 'There was an error updating the note status. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setProcessing(prev => ({ ...prev, [note.id]: false }));
    }
  };

  const handleViewNote = (note: NoteDetails) => {
    // Open the PDF in a new tab using IPFS gateway
    window.open(`https://ipfs.io/ipfs/${note.ipfsHash}`, '_blank');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading notes...</span>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-4 text-lg font-medium">No notes available</h3>
        <p className="mt-2 text-sm text-gray-500">
          There are no notes submitted for approval yet.
        </p>
      </div>
    );
  }

  // Group notes by approval status
  const pendingNotes = notes.filter(note => !note.isApproved);
  const approvedNotes = notes.filter(note => note.isApproved);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Pending Approval ({pendingNotes.length})</h2>
        {pendingNotes.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No pending notes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingNotes.map((note) => (
              <Card key={note.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{note.title}</CardTitle>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                  <CardDescription>{note.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="pb-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <User className="h-4 w-4 mr-1" />
                      <span>Created by: {truncateAddress(note.creator)}</span>
                    </div>
                    
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Date: {formatDate(note.createdAt)}</span>
                    </div>
                    
                    <div className="flex items-center text-muted-foreground">
                      <BookOpen className="h-4 w-4 mr-1" />
                      <span>Lecture ID: {note.lectureId}</span>
                    </div>
                    
                    <div className="flex items-center text-muted-foreground">
                      <Tag className="h-4 w-4 mr-1" />
                      <span>Price: {note.price} EDU</span>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    variant="outline"
                    onClick={() => handleViewNote(note)}
                  >
                    <Download className="mr-2 h-4 w-4" /> View
                  </Button>
                  
                  <div className="flex gap-2 flex-1">
                    <Button 
                      variant="default" 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApproval(note, true)}
                      disabled={processing[note.id]}
                    >
                      {processing[note.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => handleApproval(note, false)}
                      disabled={processing[note.id]}
                    >
                      {processing[note.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Approved Notes ({approvedNotes.length})</h2>
        {approvedNotes.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No approved notes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedNotes.map((note) => (
              <Card key={note.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{note.title}</CardTitle>
                    <Badge variant="default">Approved</Badge>
                  </div>
                  <CardDescription>{note.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="pb-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <User className="h-4 w-4 mr-1" />
                      <span>Created by: {truncateAddress(note.creator)}</span>
                    </div>
                    
                    <div className="flex items-center text-muted-foreground">
                      <Tag className="h-4 w-4 mr-1" />
                      <span>Price: {note.price} EDU</span>
                    </div>
                    
                    <div className="flex items-center text-muted-foreground">
                      <BookOpen className="h-4 w-4 mr-1" />
                      <span>Lecture: {note.lectureId}</span>
                    </div>
                    
                    <div className="flex items-center text-muted-foreground">
                      <Tag className="h-4 w-4 mr-1" />
                      <span>Sales: {note.salesCount}</span>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleViewNote(note)}
                  >
                    <Download className="mr-2 h-4 w-4" /> View Notes
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotesApproval; 