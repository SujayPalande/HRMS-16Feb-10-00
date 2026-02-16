import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertTriangle, 
  Mail, 
  Phone, 
  ExternalLink, 
  Users, 
  X 
} from "lucide-react";

interface ContactInfo {
  email?: string;
  phone?: string;
  upgradeLink?: string;
}

interface ContactPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
  maxEmployees: number;
  contactInfo: ContactInfo;
}

export function ContactPopup({
  isOpen,
  onClose,
  currentCount,
  maxEmployees,
  contactInfo
}: ContactPopupProps) {
  const handleUpgradeClick = () => {
    if (contactInfo.upgradeLink) {
      window.open(contactInfo.upgradeLink, '_blank');
    }
  };

  const handleEmailClick = () => {
    if (contactInfo.email) {
      window.open(`mailto:${contactInfo.email}?subject=Employee Limit Upgrade Request`, '_blank');
    }
  };

  const handlePhoneClick = () => {
    if (contactInfo.phone) {
      window.open(`tel:${contactInfo.phone}`, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-red-700">
                Employee Limit Reached
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                You've reached the maximum number of employees allowed
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-700">Current Status</p>
                    <p className="text-sm text-red-600">
                      {currentCount} of {maxEmployees} employees
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-700">
                  {Math.round((currentCount / maxEmployees) * 100)}%
                </div>
              </div>
              <div className="mt-3 w-full bg-red-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((currentCount / maxEmployees) * 100, 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Message */}
          <div className="text-center py-2">
            <p className="text-slate-700 leading-relaxed">
              To add more employees, please contact our support team to upgrade your plan. 
              Our team will help you find the right solution for your growing organization.
            </p>
          </div>

          {/* Contact Options */}
          <div className="space-y-3">
            <h4 className="font-medium text-slate-900 text-center">Contact Our Support Team</h4>
            
            <div className="grid grid-cols-1 gap-3">
              {contactInfo.email && (
                <Button
                  variant="outline"
                  onClick={handleEmailClick}
                  className="flex items-center justify-center space-x-2 h-12"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email Support</span>
                  <span className="text-xs text-slate-500">({contactInfo.email})</span>
                </Button>
              )}

              {contactInfo.phone && (
                <Button
                  variant="outline"
                  onClick={handlePhoneClick}
                  className="flex items-center justify-center space-x-2 h-12"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Support</span>
                  <span className="text-xs text-slate-500">({contactInfo.phone})</span>
                </Button>
              )}

              {contactInfo.upgradeLink && (
                <Button
                  onClick={handleUpgradeClick}
                  className="flex items-center justify-center space-x-2 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Upgrade Options</span>
                </Button>
              )}
            </div>
          </div>

          {/* Close Button */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}