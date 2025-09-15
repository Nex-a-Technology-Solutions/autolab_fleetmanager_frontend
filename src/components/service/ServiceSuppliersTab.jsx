import React, { useState, useEffect } from 'react';
import { ServiceSupplier } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Users, Mail, Phone, MapPin, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

const SupplierForm = ({ supplier, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    supplier || {
      name: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      approved: true,
      active: true,
      notes: ''
    }
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Supplier Name</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="contact_email">Contact Email</Label>
        <Input id="contact_email" name="contact_email" type="email" value={formData.contact_email} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="contact_phone">Contact Phone</Label>
        <Input id="contact_phone" name="contact_phone" value={formData.contact_phone} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" value={formData.address} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="approved" name="approved" checked={formData.approved} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, approved: checked }))} />
        <Label htmlFor="approved">Approved Supplier</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="active" name="active" checked={formData.active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))} />
        <Label htmlFor="active">Active</Label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Supplier</Button>
      </DialogFooter>
    </form>
  );
};

export default function ServiceSuppliersTab() {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
      const suppliersData = await ServiceSupplier.list('-created_date');
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async (supplierData) => {
    try {
      if (editingSupplier) {
        await ServiceSupplier.update(editingSupplier.id, supplierData);
      } else {
        await ServiceSupplier.create(supplierData);
      }
      loadSuppliers();
      setIsFormOpen(false);
      setEditingSupplier(null);
    } catch (error) {
      console.error("Error saving supplier:", error);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleDelete = async (supplierId) => {
    if (window.confirm("Are you sure you want to delete this supplier? This action cannot be undone.")) {
      try {
        await ServiceSupplier.delete(supplierId);
        loadSuppliers();
      } catch (error) {
        console.error("Error deleting supplier:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" />
            Approved Service Suppliers
          </CardTitle>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingSupplier(null)}>
                <Plus className="w-4 h-4 mr-2" /> Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSupplier ? 'Edit' : 'Add'} Supplier</DialogTitle>
              </DialogHeader>
              <SupplierForm
                supplier={editingSupplier}
                onSave={handleSave}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingSupplier(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map(supplier => (
                <motion.div
                  key={supplier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex justify-between items-start">
                        <span>{supplier.name}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(supplier.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" /> <span>{supplier.contact_email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" /> <span>{supplier.contact_phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> <span>{supplier.address || 'N/A'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}