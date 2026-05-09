import * as React from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { useTheme } from '../components/ThemeProvider';
import { motion, AnimatePresence } from 'motion/react';
import { SessionNavBar } from '../components/ui/sidebar';
import { predictProjectDetails, ProjectPrediction } from '../services/prediction';
import { 
  Upload, 
  FileText, 
  Calendar, 
  Tag, 
  Type, 
  AlignLeft, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  X,
  FileUp,
  Plus,
  BrainCircuit,
  Sparkles,
  Cpu,
  Layers,
  Activity
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export function UploadProject() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Computer Science',
    sector: '',
    field: '',
    tags: [] as string[],
  });
  
  const [isPredicting, setIsPredicting] = React.useState(false);
  const [prediction, setPrediction] = React.useState<ProjectPrediction | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.description.trim().length > 10) {
        setIsPredicting(true);
        try {
          const result = await predictProjectDetails(formData.description);
          setPrediction(result);
        } catch (e) {
          console.error('Prediction error:', e);
        } finally {
          setIsPredicting(false);
        }
      } else {
        setPrediction(null);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.description]);

  const applyPrediction = () => {
    if (prediction) {
      setFormData(prev => ({
        ...prev,
        category: prediction.domain,
        sector: prediction.sector,
        field: prediction.field,
        tags: [...new Set([...prev.tags, prediction.domain, prediction.field])]
      }));
    }
  };
  
  const [storageSetupRequired, setStorageSetupRequired] = React.useState(false);
  const [dbUpdateRequired, setDbUpdateRequired] = React.useState(false);
  const [tagInput, setTagInput] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = React.useState<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user) {
      fetchCurrentUserProfile();
    }
  }, [user]);

  const fetchCurrentUserProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (data) setCurrentUserProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const categories = [
    'Computer Science', 'Mechanical Engineering', 'Digital Media', 
    'Architecture', 'Psychology', 'Business', 'Arts', 'Other'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setFileError('Only PDF files are allowed');
        setSelectedFile(null);
      } else if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setFileError('File size must be less than 10MB');
        setSelectedFile(null);
      } else {
        setFileError(null);
        setSelectedFile(file);
      }
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedFile) {
      setFileError('Please select a PDF file to upload');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStorageSetupRequired(false);
      setDbUpdateRequired(false);

      // 1. Upload File to Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `projects/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('projects')
        .upload(filePath, selectedFile);

      if (uploadError) {
        if (uploadError.message.toLowerCase().includes('bucket not found')) {
          setStorageSetupRequired(true);
          throw new Error('Storage bucket "projects" not found.');
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('projects')
        .getPublicUrl(filePath);

      // 2. Save Metadata to Database
      const displayName = currentUserProfile?.full_name || user.email?.split('@')[0] || 'Scholar';
      const { error: dbError } = await supabase
        .from('projects')
        .insert([{
          title: formData.title,
          description: formData.description,
          student_id: user.id,
          student_name: displayName,
          category: formData.category,
          sector: formData.sector,
          field: formData.field,
          tags: formData.tags,
          pdf_url: publicUrl,
          project_date: formData.date,
        }]);

      if (dbError) {
        if (dbError.code === 'PGRST204' || dbError.message.includes('pdf_url') || dbError.message.includes('sector')) {
          setDbUpdateRequired(true);
          throw new Error('Database schema update required (missing pdf_url, sector, or field columns).');
        }
        throw dbError;
      }

      setSuccess(true);
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred during upload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "flex min-h-screen w-full font-sans transition-colors duration-500",
      theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      <SessionNavBar />

      <div className="flex flex-1 flex-col md:pl-[4.5rem] pb-20 md:pb-0">
        {/* Storage/DB Setup Warning Banner */}
        <AnimatePresence>
          {(storageSetupRequired || dbUpdateRequired) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={cn(
                "border-b px-6 py-3 flex items-center justify-between gap-4 z-50 sticky top-0 backdrop-blur-md",
                theme === 'dark' ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 text-lg font-bold">
                  !
                </div>
                <p className={cn(
                  "text-sm font-medium",
                  theme === 'dark' ? "text-amber-200" : "text-amber-800"
                )}>
                  {dbUpdateRequired ? (
                    <>
                      <span className="font-bold">Database Update Required:</span> The column "pdf_url" is missing from your "projects" table.
                    </>
                  ) : (
                    <>
                      <span className="font-bold">Storage Bucket Required:</span> The bucket "projects" was not found in your Supabase storage.
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className={cn(
                    "border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-white",
                    theme === 'light' && "bg-white"
                  )}
                  onClick={() => {
                    if (dbUpdateRequired) {
                      const msg = 'Run this SQL in your Supabase Editor:\n\n' + 
                                  'ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS pdf_url TEXT;\n' +
                                  'ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_date DATE;\n' +
                                  'ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS sector TEXT;\n' +
                                  'ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS field TEXT;';
                      alert(msg);
                    } else {
                      alert('1. Go to Supabase Storage\n2. Create a "Public" bucket named "projects"\n3. Add an "Insert" policy for authenticated users');
                    }
                  }}
                >
                  How to fix
                </Button>
                <button 
                  onClick={() => {
                    setStorageSetupRequired(false);
                    setDbUpdateRequired(false);
                  }} 
                  className="text-amber-500/50 hover:text-amber-500 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 p-6 lg:p-12 max-w-4xl mx-auto w-full">
          <header className="mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className={cn(
                "text-4xl font-serif italic mb-2 tracking-tight transition-colors",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>Upload Your project</h1>
              <p className="text-slate-500 font-light max-w-lg">
                Share your academic milestones with the global scholar community.
              </p>
            </motion.div>
          </header>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "border rounded-3xl p-12 text-center transition-colors",
                  theme === 'dark' ? "bg-teal-500/10 border-teal-500/20" : "bg-teal-50 border-teal-100"
                )}
              >
                <div className="h-16 w-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/40">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h2 className={cn(
                  "text-2xl font-serif italic mb-2 transition-colors",
                  theme === 'dark' ? "text-white" : "text-slate-900"
                )}>Upload Successful!</h2>
                <p className="text-slate-500">Your project has been shared. Redirecting to your profile...</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                {/* Form Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Basic Info */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Type className="w-3 h-3" /> Project Title
                      </label>
                      <input 
                        required
                        type="text"
                        className={cn(
                          "w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder:text-slate-400",
                          theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
                        )}
                        placeholder="e.g., Quantum Computing Fundamentals"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-teal-500" /> Completion Date
                      </label>
                      <div className="relative">
                        <input 
                          required
                          type="date"
                          className={cn(
                            "w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all",
                            theme === 'dark' 
                              ? "bg-white/10 border-white/20 text-white [color-scheme:dark] hover:bg-white/15" 
                              : "bg-white border-slate-200 text-slate-900 [color-scheme:light] hover:bg-slate-50"
                          )}
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Tag className="w-3 h-3" /> Academic Field
                      </label>
                      <select 
                        className={cn(
                          "w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all appearance-none cursor-pointer",
                          theme === 'dark' ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
                        )}
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat} className={theme === 'dark' ? "bg-slate-900" : "bg-white"}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description & Tags */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <AlignLeft className="w-3 h-3" /> Description
                      </label>
                      <textarea 
                        required
                        className={cn(
                          "w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder:text-slate-400 min-h-[148px]",
                          theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
                        )}
                        placeholder="Briefly explain the objectives and outcomes of your project..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Plus className="w-3 h-3" /> Tags
                      </label>
                      <input 
                        type="text"
                        className={cn(
                          "w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder:text-slate-400",
                          theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
                        )}
                        placeholder="Type and press Enter (e.g., Research, AI)"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map(tag => (
                          <div key={tag} className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold gap-1.5 py-1 pr-1 transition-all",
                            theme === 'dark' 
                              ? "bg-white/5 hover:bg-white/10 text-slate-300 border-white/5" 
                              : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
                          )}>
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)} className={theme === 'dark' ? "hover:text-rose-400" : "hover:text-rose-500"}>
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Prediction Section */}
                    <AnimatePresence>
                      {prediction && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={cn(
                            "border rounded-2xl p-4 overflow-hidden relative group transition-all",
                            theme === 'dark' ? "bg-teal-500/10 border-teal-500/30" : "bg-teal-50/50 border-teal-200"
                          )}
                        >
                          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                            <Sparkles className="w-12 h-12 text-teal-400" />
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <div className="bg-teal-500/20 p-1.5 rounded-lg">
                              <BrainCircuit className={cn("w-4 h-4", theme === 'dark' ? "text-teal-400" : "text-teal-600")} />
                            </div>
                            <span className={cn("text-xs font-bold uppercase tracking-widest", theme === 'dark' ? "text-teal-400" : "text-teal-600")}>TFLite Predicted Intelligence</span>
                          </div>

                          <div className="grid grid-cols-1 gap-3 relative z-10">
                            <div className={cn("flex justify-between items-center px-3 py-2 rounded-xl", theme === 'dark' ? "bg-slate-950/40" : "bg-white/80 border border-teal-100 shadow-sm")}>
                              <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Domain</span>
                              <span className={cn("text-sm font-medium", theme === 'dark' ? "text-teal-100" : "text-teal-700")}>{prediction.domain}</span>
                            </div>
                            <div className={cn("flex justify-between items-center px-3 py-2 rounded-xl", theme === 'dark' ? "bg-slate-950/40" : "bg-white/80 border border-teal-100 shadow-sm")}>
                              <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Sector</span>
                              <span className={cn("text-sm font-medium", theme === 'dark' ? "text-teal-100" : "text-teal-700")}>{prediction.sector}</span>
                            </div>
                            <div className={cn("flex justify-between items-center px-3 py-2 rounded-xl", theme === 'dark' ? "bg-slate-950/40" : "bg-white/80 border border-teal-100 shadow-sm")}>
                              <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Field</span>
                              <span className={cn("text-sm font-medium", theme === 'dark' ? "text-teal-100" : "text-teal-700")}>{prediction.field}</span>
                            </div>
                          </div>

                          <button 
                            type="button"
                            onClick={applyPrediction}
                            className={cn(
                              "w-full mt-4 text-xs py-2 rounded-xl border transition-all font-bold tracking-widest uppercase",
                              theme === 'dark' 
                                ? "bg-teal-500/20 hover:bg-teal-500/40 text-teal-300 border-teal-500/30" 
                                : "bg-teal-500 text-white hover:bg-teal-600 border-none shadow-md shadow-teal-500/20"
                            )}
                          >
                            Apply Smart Details
                          </button>
                        </motion.div>
                      )}
                      
                      {isPredicting && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 p-4 text-teal-500/60"
                        >
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs font-medium italic">TFLite analyzing project context...</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Additional Metadata Fields */}
                <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-t", theme === 'dark' ? "border-white/5" : "border-slate-100")}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Layers className="w-3 h-3" /> Sector
                      </label>
                      <input 
                        type="text"
                        className={cn(
                          "w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder:text-slate-400",
                          theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
                        )}
                        placeholder="e.g., Information Technology"
                        value={formData.sector}
                        onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Specialized Field
                      </label>
                      <input 
                        type="text"
                        className={cn(
                          "w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder:text-slate-400",
                          theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
                        )}
                        placeholder="e.g., Software Engineering"
                        value={formData.field}
                        onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* File Upload Area */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Project Document (PDF)
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && file.type === 'application/pdf') {
                        setSelectedFile(file);
                        setFileError(null);
                      } else {
                        setFileError('Please drop a valid PDF file');
                      }
                    }}
                    className={cn(
                      "border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center text-center group",
                      selectedFile 
                        ? (theme === 'dark' ? "border-teal-500/50 bg-teal-500/5" : "border-teal-500/50 bg-teal-50") 
                        : (theme === 'dark' ? "border-white/10 hover:border-teal-500/30 hover:bg-white/5" : "border-slate-200 hover:border-teal-500/30 hover:bg-white")
                    )}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".pdf" 
                      onChange={handleFileChange} 
                    />
                    
                    <div className={cn(
                      "h-16 w-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm",
                      selectedFile 
                        ? (theme === 'dark' ? "bg-teal-500/20 text-teal-400" : "bg-teal-500 text-white") 
                        : (theme === 'dark' ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-400")
                    )}>
                      {selectedFile ? <CheckCircle2 className="w-8 h-8" /> : <FileUp className="w-8 h-8" />}
                    </div>
                    
                    <div className="space-y-1">
                      <p className={cn(
                        "font-medium transition-colors",
                        theme === 'dark' ? "text-white" : "text-slate-900"
                      )}>
                        {selectedFile ? selectedFile.name : 'Click or drag PDF to upload'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Max size: 10MB'}
                      </p>
                    </div>
                  </div>
                  {fileError && (
                    <p className="text-xs text-rose-500 flex items-center gap-1.5 mt-2">
                      <AlertCircle className="w-3 h-3" /> {fileError}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => navigate(-1)}
                    className="text-slate-400 hover:text-teal-500 transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button 
                    disabled={loading}
                    className="bg-teal-500 hover:bg-teal-400 text-white px-8 rounded-xl shadow-lg shadow-teal-500/20 h-12 min-w-[160px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      'Publish Project'
                    )}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
