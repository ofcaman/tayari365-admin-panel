import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Upload, Download } from "lucide-react";
import Papa from "papaparse";

interface Municipality {
  id: string;
  name: string;
  districtId: string;
}

interface District {
  id: string;
  name: string;
  provinceId: string;
}

interface Province {
  id: string;
  name: string;
}

export default function LocationManagement() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  
  const [newProvince, setNewProvince] = useState("");
  const [newDistrict, setNewDistrict] = useState("");
  const [selectedProvinceForDistrict, setSelectedProvinceForDistrict] = useState("");
  const [newMunicipality, setNewMunicipality] = useState("");
  const [selectedDistrictForMunicipality, setSelectedDistrictForMunicipality] = useState("");
  
  const [openProvinceDialog, setOpenProvinceDialog] = useState(false);
  const [openDistrictDialog, setOpenDistrictDialog] = useState(false);
  const [openMunicipalityDialog, setOpenMunicipalityDialog] = useState(false);
  const [openBulkUploadDialog, setOpenBulkUploadDialog] = useState(false);

  useEffect(() => {
    fetchProvinces();
    fetchDistricts();
    fetchMunicipalities();
  }, []);

  const fetchProvinces = async () => {
    const querySnapshot = await getDocs(collection(db, "provinces"));
    const provincesData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
    }));
    setProvinces(provincesData);
  };

  const fetchDistricts = async () => {
    const querySnapshot = await getDocs(collection(db, "districts"));
    const districtsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      provinceId: doc.data().provinceId,
    }));
    setDistricts(districtsData);
  };

  const fetchMunicipalities = async () => {
    const querySnapshot = await getDocs(collection(db, "municipalities"));
    const municipalitiesData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      districtId: doc.data().districtId,
    }));
    setMunicipalities(municipalitiesData);
  };

  const handleAddProvince = async () => {
    if (!newProvince.trim()) {
      toast.error("Province name is required");
      return;
    }

    try {
      await addDoc(collection(db, "provinces"), {
        name: newProvince,
        createdAt: new Date(),
      });
      toast.success("Province added successfully");
      setNewProvince("");
      setOpenProvinceDialog(false);
      fetchProvinces();
    } catch (error) {
      toast.error("Failed to add province");
      console.error(error);
    }
  };

  const handleAddDistrict = async () => {
    if (!newDistrict.trim() || !selectedProvinceForDistrict) {
      toast.error("District name and province are required");
      return;
    }

    try {
      await addDoc(collection(db, "districts"), {
        name: newDistrict,
        provinceId: selectedProvinceForDistrict,
        createdAt: new Date(),
      });
      toast.success("District added successfully");
      setNewDistrict("");
      setSelectedProvinceForDistrict("");
      setOpenDistrictDialog(false);
      fetchDistricts();
    } catch (error) {
      toast.error("Failed to add district");
      console.error(error);
    }
  };

  const handleAddMunicipality = async () => {
    if (!newMunicipality.trim() || !selectedDistrictForMunicipality) {
      toast.error("Municipality name and district are required");
      return;
    }

    try {
      await addDoc(collection(db, "municipalities"), {
        name: newMunicipality,
        districtId: selectedDistrictForMunicipality,
        createdAt: new Date(),
      });
      toast.success("Municipality added successfully");
      setNewMunicipality("");
      setSelectedDistrictForMunicipality("");
      setOpenMunicipalityDialog(false);
      fetchMunicipalities();
    } catch (error) {
      toast.error("Failed to add municipality");
      console.error(error);
    }
  };

  const handleDeleteProvince = async (id: string) => {
    try {
      await deleteDoc(doc(db, "provinces", id));
      toast.success("Province deleted");
      fetchProvinces();
    } catch (error) {
      toast.error("Failed to delete province");
    }
  };

  const handleDeleteDistrict = async (id: string) => {
    try {
      await deleteDoc(doc(db, "districts", id));
      toast.success("District deleted");
      fetchDistricts();
    } catch (error) {
      toast.error("Failed to delete district");
    }
  };

  const handleDeleteMunicipality = async (id: string) => {
    try {
      await deleteDoc(doc(db, "municipalities", id));
      toast.success("Municipality deleted");
      fetchMunicipalities();
    } catch (error) {
      toast.error("Failed to delete municipality");
    }
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const data = results.data as any[];
          
          for (const row of data) {
            if (!row.Province || !row.District || !row.Municipality) continue;

            // Check if province exists, if not create it
            let provinceId = provinces.find(p => p.name === row.Province)?.id;
            if (!provinceId) {
              const provinceDoc = await addDoc(collection(db, "provinces"), {
                name: row.Province,
                createdAt: new Date(),
              });
              provinceId = provinceDoc.id;
            }

            // Check if district exists, if not create it
            let districtId = districts.find(d => d.name === row.District && d.provinceId === provinceId)?.id;
            if (!districtId) {
              const districtDoc = await addDoc(collection(db, "districts"), {
                name: row.District,
                provinceId: provinceId,
                createdAt: new Date(),
              });
              districtId = districtDoc.id;
            }

            // Check if municipality exists, if not create it
            const municipalityExists = municipalities.find(
              m => m.name === row.Municipality && m.districtId === districtId
            );
            if (!municipalityExists) {
              await addDoc(collection(db, "municipalities"), {
                name: row.Municipality,
                districtId: districtId,
                createdAt: new Date(),
              });
            }
          }

          toast.success("Bulk upload completed successfully");
          setOpenBulkUploadDialog(false);
          fetchProvinces();
          fetchDistricts();
          fetchMunicipalities();
        } catch (error) {
          toast.error("Failed to process bulk upload");
          console.error(error);
        }
      },
      error: (error) => {
        toast.error("Failed to parse CSV file");
        console.error(error);
      },
    });
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      { Province: "Bagmati Province", District: "Kathmandu", Municipality: "Kathmandu Metropolitan City" },
      { Province: "Bagmati Province", District: "Kathmandu", Municipality: "Lalitpur Metropolitan City" },
      { Province: "Gandaki Province", District: "Kaski", Municipality: "Pokhara Metropolitan City" },
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "location_sample.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getProvinceName = (provinceId: string) => {
    return provinces.find(p => p.id === provinceId)?.name || "Unknown";
  };

  const getDistrictName = (districtId: string) => {
    return districts.find(d => d.id === districtId)?.name || "Unknown";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Location Management</h1>
          <div className="flex gap-2">
            <Button onClick={downloadSampleCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Sample CSV
            </Button>
            <Dialog open={openBulkUploadDialog} onOpenChange={setOpenBulkUploadDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Upload Locations</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Upload CSV File</Label>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleBulkUpload}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV file with columns: Province, District, Municipality
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Provinces Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Provinces
                </span>
                <Dialog open={openProvinceDialog} onOpenChange={setOpenProvinceDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Province</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Province Name</Label>
                        <Input
                          value={newProvince}
                          onChange={(e) => setNewProvince(e.target.value)}
                          placeholder="Enter province name"
                        />
                      </div>
                      <Button onClick={handleAddProvince} className="w-full">
                        Add Province
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {provinces.map((province) => (
                  <div
                    key={province.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-accent"
                  >
                    <span>{province.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteProvince(province.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Districts Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Districts
                </span>
                <Dialog open={openDistrictDialog} onOpenChange={setOpenDistrictDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add District</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Province</Label>
                        <Select
                          value={selectedProvinceForDistrict}
                          onValueChange={setSelectedProvinceForDistrict}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                          <SelectContent>
                            {provinces.map((province) => (
                              <SelectItem key={province.id} value={province.id}>
                                {province.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>District Name</Label>
                        <Input
                          value={newDistrict}
                          onChange={(e) => setNewDistrict(e.target.value)}
                          placeholder="Enter district name"
                        />
                      </div>
                      <Button onClick={handleAddDistrict} className="w-full">
                        Add District
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {districts.map((district) => (
                  <div
                    key={district.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-accent"
                  >
                    <div>
                      <div>{district.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {getProvinceName(district.provinceId)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteDistrict(district.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Municipalities Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Municipalities
                </span>
                <Dialog open={openMunicipalityDialog} onOpenChange={setOpenMunicipalityDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Municipality</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>District</Label>
                        <Select
                          value={selectedDistrictForMunicipality}
                          onValueChange={setSelectedDistrictForMunicipality}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.map((district) => (
                              <SelectItem key={district.id} value={district.id}>
                                {district.name} ({getProvinceName(district.provinceId)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Municipality Name</Label>
                        <Input
                          value={newMunicipality}
                          onChange={(e) => setNewMunicipality(e.target.value)}
                          placeholder="Enter municipality name"
                        />
                      </div>
                      <Button onClick={handleAddMunicipality} className="w-full">
                        Add Municipality
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {municipalities.map((municipality) => (
                  <div
                    key={municipality.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-accent"
                  >
                    <div>
                      <div>{municipality.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {getDistrictName(municipality.districtId)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteMunicipality(municipality.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
