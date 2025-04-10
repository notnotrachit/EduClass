// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NotesContract is ERC721, Ownable {
    using Counters for Counters.Counter;
    
    struct Note {
        uint256 id;
        string title;
        string description;
        string ipfsHash;
        address creator;
        uint256 price;
        uint256 createdAt;
        uint256 lectureId;
        bool isApproved;
    }
    
    // Events
    event NoteCreated(uint256 indexed noteId, address indexed creator, string title);
    event NotePurchased(uint256 indexed noteId, address indexed buyer, address indexed seller);
    event NoteApproved(uint256 indexed noteId, bool approved);
    
    // State variables
    Counters.Counter private _noteIdCounter;
    mapping(uint256 => Note) public notes;
    mapping(address => mapping(uint256 => bool)) private _notePurchases;
    mapping(uint256 => uint256) private _noteSales;
    string public className;
    
    constructor(address initialOwner, string memory _className) 
        ERC721("EduNotes", "EDN") 
        Ownable(initialOwner) 
    {
        className = _className;
    }
    
    // Create a new note
    function createNote(
        string memory title,
        string memory description,
        string memory ipfsHash,
        uint256 price,
        uint256 lectureId
    ) public returns (uint256) {
        _noteIdCounter.increment();
        uint256 noteId = _noteIdCounter.current();
        
        notes[noteId] = Note({
            id: noteId,
            title: title,
            description: description,
            ipfsHash: ipfsHash,
            creator: msg.sender,
            price: price,
            createdAt: block.timestamp,
            lectureId: lectureId,
            isApproved: true // Auto-approve notes when created
        });
        
        _mint(msg.sender, noteId);
        
        emit NoteCreated(noteId, msg.sender, title);
        return noteId;
    }
    
    // Approve a note
    function approveNote(uint256 noteId, bool approved) public onlyOwner {
        require(noteId > 0 && noteId <= _noteIdCounter.current(), "Invalid ID");
        notes[noteId].isApproved = approved;
        emit NoteApproved(noteId, approved);
    }
    
    // Purchase a note
    function purchaseNote(uint256 noteId) public payable {
        require(noteId > 0 && noteId <= _noteIdCounter.current(), "Invalid ID");
        require(notes[noteId].isApproved, "Not approved");
        require(!_notePurchases[msg.sender][noteId], "Already purchased");
        require(msg.sender != notes[noteId].creator, "Cannot buy own note");
        require(msg.value >= notes[noteId].price, "Insufficient funds");
        
        address payable creator = payable(notes[noteId].creator);
        _notePurchases[msg.sender][noteId] = true;
        _noteSales[noteId]++;
        creator.transfer(msg.value);
        
        emit NotePurchased(noteId, msg.sender, creator);
    }
    
    // Check if a user has purchased a note
    function hasPurchasedNote(address user, uint256 noteId) public view returns (bool) {
        return _notePurchases[user][noteId] || notes[noteId].creator == user;
    }
    
    // Get note details
    function getNoteDetails(uint256 noteId) public view returns (
        string memory title,
        string memory description,
        string memory ipfsHash,
        address creator,
        uint256 price,
        bool isApproved
    ) {
        require(noteId > 0 && noteId <= _noteIdCounter.current(), "Invalid ID");
        Note storage note = notes[noteId];
        
        return (
            note.title,
            note.description,
            note.ipfsHash,
            note.creator,
            note.price,
            note.isApproved
        );
    }
    
    // Update note price
    function updateNotePrice(uint256 noteId, uint256 newPrice) public {
        require(noteId > 0 && noteId <= _noteIdCounter.current(), "Invalid ID");
        require(notes[noteId].creator == msg.sender, "Not creator");
        notes[noteId].price = newPrice;
    }
    
    // Get notes created by a student
    function getCreatedNotes(address creator) public view returns (uint256[] memory) {
        uint256 totalNotes = _noteIdCounter.current();
        uint256 count = 0;
        
        for (uint256 i = 1; i <= totalNotes; i++) {
            if (notes[i].creator == creator) {
                count++;
            }
        }
        
        uint256[] memory createdNoteIds = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= totalNotes; i++) {
            if (notes[i].creator == creator) {
                createdNoteIds[index] = i;
                index++;
            }
        }
        
        return createdNoteIds;
    }
    
    // Get all notes
    function getAllNotes() public view returns (uint256[] memory) {
        uint256 totalNotes = _noteIdCounter.current();
        uint256[] memory allNoteIds = new uint256[](totalNotes);
        
        for (uint256 i = 1; i <= totalNotes; i++) {
            allNoteIds[i-1] = i;
        }
        
        return allNoteIds;
    }
    
    // Get approved notes
    function getApprovedNotes() public view returns (uint256[] memory) {
        uint256 totalNotes = _noteIdCounter.current();
        uint256 approvedCount = 0;
        
        // Count approved notes
        for (uint256 i = 1; i <= totalNotes; i++) {
            if (notes[i].isApproved) {
                approvedCount++;
            }
        }
        
        uint256[] memory approvedNoteIds = new uint256[](approvedCount);
        uint256 index = 0;
        
        // Fill approved note IDs
        for (uint256 i = 1; i <= totalNotes; i++) {
            if (notes[i].isApproved) {
                approvedNoteIds[index] = i;
                index++;
            }
        }
        
        return approvedNoteIds;
    }
    
    // Get notes purchased by a student
    function getPurchasedNotes(address buyer) public view returns (uint256[] memory) {
        uint256 totalNotes = _noteIdCounter.current();
        uint256 count = 0;
        
        // Count purchased notes
        for (uint256 i = 1; i <= totalNotes; i++) {
            if (_notePurchases[buyer][i]) {
                count++;
            }
        }
        
        uint256[] memory purchasedNoteIds = new uint256[](count);
        uint256 index = 0;
        
        // Fill purchased note IDs
        for (uint256 i = 1; i <= totalNotes; i++) {
            if (_notePurchases[buyer][i]) {
                purchasedNoteIds[index] = i;
                index++;
            }
        }
        
        return purchasedNoteIds;
    }
} 