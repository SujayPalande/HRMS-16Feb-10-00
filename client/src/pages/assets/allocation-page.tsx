import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Box, Plus, Search, Laptop, Smartphone, Monitor, Keyboard, Users, Eye, Edit, X, Check, Trash2, Headphones, Cpu, Printer } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Asset {
  id: number;
  assetId: string;
  type: string;
  name: string;
  allocatedTo: string;
  department: string;
  allocatedDate: string;
  status: "Active" | "Available" | "Under Repair";
  serialNumber?: string;
  purchaseDate?: string;
  notes?: string;
}

export default function AssetAllocationPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [assets, setAssets] = useState<Asset[]>([
    { id: 1, assetId: "LAP-001", type: "Laptop", name: "MacBook Pro 14\"", allocatedTo: "John Doe", department: "Engineering", allocatedDate: "Jan 15, 2023", status: "Active", serialNumber: "SN-2023-001", purchaseDate: "Dec 10, 2022", notes: "Issued for development work" },
    { id: 2, assetId: "MON-012", type: "Monitor", name: "Dell 27\" 4K", allocatedTo: "Jane Smith", department: "Marketing", allocatedDate: "Feb 20, 2023", status: "Active", serialNumber: "SN-2023-012", purchaseDate: "Jan 5, 2023", notes: "Secondary monitor" },
    { id: 3, assetId: "PHN-005", type: "Phone", name: "iPhone 14 Pro", allocatedTo: "Mike Johnson", department: "Sales", allocatedDate: "Mar 10, 2023", status: "Active", serialNumber: "SN-2023-005", purchaseDate: "Feb 28, 2023", notes: "Company phone" },
    { id: 4, assetId: "KEY-020", type: "Keyboard", name: "Logitech MX Keys", allocatedTo: "Sarah Wilson", department: "HR", allocatedDate: "Apr 5, 2023", status: "Active", serialNumber: "SN-2023-020", purchaseDate: "Mar 20, 2023", notes: "Ergonomic keyboard" },
    { id: 5, assetId: "LAP-015", type: "Laptop", name: "ThinkPad X1 Carbon", allocatedTo: "-", department: "-", allocatedDate: "-", status: "Available", serialNumber: "SN-2023-015", purchaseDate: "Apr 1, 2023", notes: "Available for allocation" },
    { id: 6, assetId: "HDP-003", type: "Headphones", name: "Sony WH-1000XM5", allocatedTo: "-", department: "-", allocatedDate: "-", status: "Available", serialNumber: "SN-2023-033", purchaseDate: "Mar 15, 2023", notes: "Noise cancelling headphones" },
    { id: 7, assetId: "CPU-008", type: "Desktop", name: "Dell Optiplex 7090", allocatedTo: "-", department: "-", allocatedDate: "-", status: "Under Repair", serialNumber: "SN-2022-108", purchaseDate: "Nov 10, 2022", notes: "Hard drive replacement needed" },
  ]);

  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [allocateToAsset, setAllocateToAsset] = useState<Asset | null>(null);

  const [newAsset, setNewAsset] = useState({
    assetId: "",
    type: "",
    name: "",
    serialNumber: "",
    purchaseDate: "",
    notes: "",
  });

  const [allocateForm, setAllocateForm] = useState({
    employeeName: "",
    department: "",
    notes: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    type: "",
    serialNumber: "",
    notes: "",
    status: "",
  });

  const employees = [
    { name: "John Doe", department: "Engineering" },
    { name: "Jane Smith", department: "Marketing" },
    { name: "Mike Johnson", department: "Sales" },
    { name: "Sarah Wilson", department: "HR" },
    { name: "Robert Brown", department: "Finance" },
    { name: "Emily Davis", department: "Engineering" },
    { name: "David Lee", department: "Operations" },
  ];

  const assetTypes = ["Laptop", "Monitor", "Phone", "Keyboard", "Headphones", "Desktop", "Printer", "Tablet"];
  const departments = ["Engineering", "Marketing", "Sales", "HR", "Finance", "Operations"];

  const assetStats = [
    { title: "Total Assets", value: assets.length.toString(), icon: <Box className="h-5 w-5" /> },
    { title: "Allocated", value: assets.filter(a => a.status === "Active").length.toString(), icon: <Users className="h-5 w-5" />, color: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
    { title: "Available", value: assets.filter(a => a.status === "Available").length.toString(), icon: <Box className="h-5 w-5" />, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    { title: "Under Repair", value: assets.filter(a => a.status === "Under Repair").length.toString(), icon: <Box className="h-5 w-5" />, color: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" },
  ];

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "Laptop": return <Laptop className="h-5 w-5" />;
      case "Monitor": return <Monitor className="h-5 w-5" />;
      case "Phone": return <Smartphone className="h-5 w-5" />;
      case "Keyboard": return <Keyboard className="h-5 w-5" />;
      case "Headphones": return <Headphones className="h-5 w-5" />;
      case "Desktop": return <Cpu className="h-5 w-5" />;
      case "Printer": return <Printer className="h-5 w-5" />;
      default: return <Box className="h-5 w-5" />;
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.assetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.allocatedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    const matchesType = typeFilter === "all" || asset.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAddNewAsset = () => {
    setNewAsset({
      assetId: "",
      type: "",
      name: "",
      serialNumber: "",
      purchaseDate: "",
      notes: "",
    });
    setAllocateDialogOpen(true);
  };

  const handleCreateAsset = () => {
    if (!newAsset.assetId || !newAsset.type || !newAsset.name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Asset ID, Type, Name).",
        variant: "destructive",
      });
      return;
    }

    const asset: Asset = {
      id: Date.now(),
      assetId: newAsset.assetId,
      type: newAsset.type,
      name: newAsset.name,
      allocatedTo: "-",
      department: "-",
      allocatedDate: "-",
      status: "Available",
      serialNumber: newAsset.serialNumber,
      purchaseDate: newAsset.purchaseDate,
      notes: newAsset.notes,
    };

    setAssets([...assets, asset]);
    setAllocateDialogOpen(false);
    toast({
      title: "Asset Added",
      description: `${asset.name} has been added successfully.`,
    });
  };

  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setViewDialogOpen(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setEditForm({
      name: asset.name,
      type: asset.type,
      serialNumber: asset.serialNumber || "",
      notes: asset.notes || "",
      status: asset.status,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedAsset) return;

    setAssets(assets.map(a => 
      a.id === selectedAsset.id 
        ? { 
            ...a, 
            name: editForm.name,
            type: editForm.type,
            serialNumber: editForm.serialNumber,
            notes: editForm.notes,
            status: editForm.status as Asset["status"],
          }
        : a
    ));

    setEditDialogOpen(false);
    toast({
      title: "Asset Updated",
      description: "Asset details have been updated successfully.",
    });
  };

  const handleAllocateClick = (asset: Asset) => {
    setAllocateToAsset(asset);
    setAllocateForm({
      employeeName: "",
      department: "",
      notes: "",
    });
  };

  const handleConfirmAllocate = () => {
    if (!allocateToAsset || !allocateForm.employeeName || !allocateForm.department) {
      toast({
        title: "Validation Error",
        description: "Please select an employee and department.",
        variant: "destructive",
      });
      return;
    }

    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    setAssets(assets.map(a => 
      a.id === allocateToAsset.id 
        ? { 
            ...a, 
            allocatedTo: allocateForm.employeeName,
            department: allocateForm.department,
            allocatedDate: today,
            status: "Active" as const,
            notes: allocateForm.notes || a.notes,
          }
        : a
    ));

    setAllocateToAsset(null);
    toast({
      title: "Asset Allocated",
      description: `${allocateToAsset.name} has been allocated to ${allocateForm.employeeName}.`,
    });
  };

  const handleDeallocate = (asset: Asset) => {
    setAssets(assets.map(a => 
      a.id === asset.id 
        ? { 
            ...a, 
            allocatedTo: "-",
            department: "-",
            allocatedDate: "-",
            status: "Available" as const,
          }
        : a
    ));

    setViewDialogOpen(false);
    toast({
      title: "Asset Deallocated",
      description: `${asset.name} is now available for allocation.`,
    });
  };

  const handleDeleteAsset = (asset: Asset) => {
    setAssets(assets.filter(a => a.id !== asset.id));
    setViewDialogOpen(false);
    toast({
      title: "Asset Deleted",
      description: `${asset.name} has been removed from the system.`,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-page-title">Asset Allocation</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage asset allocation to employees</p>
          </div>
          <Button className="gap-2" onClick={handleAddNewAsset} data-testid="button-allocate-asset">
            <Plus className="h-4 w-4" />
            Add New Asset
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {assetStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card data-testid={`card-stat-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stat.color || "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"}`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-teal-600" />
                  Asset Allocations
                </CardTitle>
                <CardDescription>All assets and their allocation status</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-36" data-testid="select-type-filter">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {assetTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-36" data-testid="select-status-filter">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Under Repair">Under Repair</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search assets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Asset ID</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Allocated To</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        No assets found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset, index) => (
                      <tr key={asset.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50" data-testid={`row-asset-${index}`}>
                        <td className="py-3 px-4 font-mono text-sm">{asset.assetId}</td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-2">
                            {getAssetIcon(asset.type)}
                            {asset.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium">{asset.name}</td>
                        <td className="py-3 px-4">{asset.allocatedTo}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{asset.department}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{asset.allocatedDate}</td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={asset.status === "Active" ? "default" : asset.status === "Available" ? "secondary" : "outline"}
                            className={
                              asset.status === "Active" 
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                : asset.status === "Under Repair"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : ""
                            }
                          >
                            {asset.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {asset.status === "Available" ? (
                              <Button size="sm" onClick={() => handleAllocateClick(asset)} data-testid={`button-allocate-${index}`}>
                                Allocate
                              </Button>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleViewAsset(asset)} data-testid={`button-view-${index}`}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleEditAsset(asset)} data-testid={`button-edit-${index}`}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Asset Dialog */}
      <Dialog open={allocateDialogOpen} onOpenChange={setAllocateDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>Add a new asset to the inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assetId">Asset ID *</Label>
              <Input
                id="assetId"
                placeholder="e.g., LAP-016"
                value={newAsset.assetId}
                onChange={(e) => setNewAsset({ ...newAsset, assetId: e.target.value })}
                data-testid="input-asset-id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Asset Type *</Label>
              <Select value={newAsset.type} onValueChange={(value) => setNewAsset({ ...newAsset, type: value })}>
                <SelectTrigger data-testid="select-asset-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                placeholder="e.g., MacBook Pro 16 inch"
                value={newAsset.name}
                onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                data-testid="input-asset-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                placeholder="e.g., SN-2024-001"
                value={newAsset.serialNumber}
                onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                data-testid="input-serial-number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={newAsset.purchaseDate}
                onChange={(e) => setNewAsset({ ...newAsset, purchaseDate: e.target.value })}
                data-testid="input-purchase-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about the asset..."
                value={newAsset.notes}
                onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
                data-testid="textarea-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllocateDialogOpen(false)} data-testid="button-cancel-add">
              Cancel
            </Button>
            <Button onClick={handleCreateAsset} data-testid="button-confirm-add">
              Add Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Asset Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAsset && getAssetIcon(selectedAsset.type)}
              {selectedAsset?.name}
            </DialogTitle>
            <DialogDescription>Asset Details</DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Asset ID</p>
                  <p className="font-mono font-medium">{selectedAsset.assetId}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Type</p>
                  <p className="font-medium">{selectedAsset.type}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Serial Number</p>
                  <p className="font-mono font-medium">{selectedAsset.serialNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                  <Badge 
                    className={
                      selectedAsset.status === "Active" 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : selectedAsset.status === "Under Repair"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : ""
                    }
                  >
                    {selectedAsset.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Allocated To</p>
                  <p className="font-medium">{selectedAsset.allocatedTo}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Department</p>
                  <p className="font-medium">{selectedAsset.department}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Allocation Date</p>
                  <p className="font-medium">{selectedAsset.allocatedDate}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Purchase Date</p>
                  <p className="font-medium">{selectedAsset.purchaseDate || "-"}</p>
                </div>
              </div>
              {selectedAsset.notes && (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Notes</p>
                  <p className="text-sm mt-1">{selectedAsset.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedAsset?.status === "Active" && (
              <Button variant="outline" className="text-orange-600" onClick={() => handleDeallocate(selectedAsset)} data-testid="button-deallocate">
                <X className="h-4 w-4 mr-2" />
                Deallocate
              </Button>
            )}
            <Button variant="outline" className="text-red-600" onClick={() => selectedAsset && handleDeleteAsset(selectedAsset)} data-testid="button-delete">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" onClick={() => selectedAsset && handleEditAsset(selectedAsset)} data-testid="button-edit-from-view">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>Update asset details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Asset Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Asset Type</Label>
              <Select value={editForm.type} onValueChange={(value) => setEditForm({ ...editForm, type: value })}>
                <SelectTrigger data-testid="select-edit-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-serial">Serial Number</Label>
              <Input
                id="edit-serial"
                value={editForm.serialNumber}
                onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })}
                data-testid="input-edit-serial"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                <SelectTrigger data-testid="select-edit-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Under Repair">Under Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                data-testid="textarea-edit-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} data-testid="button-save-edit">
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allocate Asset to Employee Dialog */}
      <Dialog open={!!allocateToAsset} onOpenChange={() => setAllocateToAsset(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Allocate Asset</DialogTitle>
            <DialogDescription>
              Assign {allocateToAsset?.name} to an employee
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <Select 
                value={allocateForm.employeeName} 
                onValueChange={(value) => {
                  const emp = employees.find(e => e.name === value);
                  setAllocateForm({ 
                    ...allocateForm, 
                    employeeName: value,
                    department: emp?.department || ""
                  });
                }}
              >
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.name} value={emp.name}>
                      {emp.name} - {emp.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select 
                value={allocateForm.department} 
                onValueChange={(value) => setAllocateForm({ ...allocateForm, department: value })}
              >
                <SelectTrigger data-testid="select-department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Allocation notes..."
                value={allocateForm.notes}
                onChange={(e) => setAllocateForm({ ...allocateForm, notes: e.target.value })}
                data-testid="textarea-allocate-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllocateToAsset(null)} data-testid="button-cancel-allocate">
              Cancel
            </Button>
            <Button onClick={handleConfirmAllocate} data-testid="button-confirm-allocate">
              <Check className="h-4 w-4 mr-2" />
              Allocate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
