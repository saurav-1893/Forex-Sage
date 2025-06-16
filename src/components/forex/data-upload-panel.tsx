'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Upload, FileText, CheckCircle, AlertCircle, Download, Trash2, Info } from 'lucide-react'

interface UploadedFile {
  id: string
  name: string
  size: number
  uploadDate: Date
  rows: number
  columns: string[]
  status: 'processing' | 'completed' | 'error'
  preview?: any[]
}

export function DataUploadPanel() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    {
      id: '1',
      name: 'EURUSD_H1_2024.csv',
      size: 2048576,
      uploadDate: new Date('2024-01-15'),
      rows: 8760,
      columns: ['timestamp', 'open', 'high', 'low', 'close', 'volume'],
      status: 'completed',
      preview: [
        { timestamp: '2024-01-01 00:00', open: 1.1045, high: 1.1055, low: 1.1040, close: 1.1050, volume: 1250 },
        { timestamp: '2024-01-01 01:00', open: 1.1050, high: 1.1065, low: 1.1048, close: 1.1060, volume: 1180 },
        { timestamp: '2024-01-01 02:00', open: 1.1060, high: 1.1070, low: 1.1055, close: 1.1065, volume: 980 }
      ]
    }
  ])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate file processing
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      uploadDate: new Date(),
      rows: 0,
      columns: [],
      status: 'processing'
    }

    setUploadedFiles(prev => [...prev, newFile])

    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setUploadProgress(i)
    }

    // Parse CSV (simplified simulation)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n')
      const headers = lines[0]?.split(',').map(h => h.trim()) || []
      const dataRows = lines.slice(1).filter(line => line.trim())
      
      const preview = dataRows.slice(0, 3).map(line => {
        const values = line.split(',')
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim()
        })
        return row
      })

      setUploadedFiles(prev => prev.map(f => 
        f.id === newFile.id 
          ? { 
              ...f, 
              rows: dataRows.length, 
              columns: headers,
              status: 'completed',
              preview 
            }
          : f
      ))
    }

    reader.readAsText(file)
    setIsUploading(false)
    setUploadProgress(0)
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFileUpload(e.dataTransfer.files)
  }, [handleFileUpload])

  const deleteFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Historical Forex Data
          </CardTitle>
          <CardDescription>
            Upload your CSV files containing historical forex data for enhanced AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CSV Format Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Expected CSV format:</strong> timestamp, open, high, low, close, volume
              <br />
              <strong>Date format:</strong> YYYY-MM-DD HH:MM or YYYY-MM-DD HH:MM:SS
            </AlertDescription>
          </Alert>

          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {dragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
              </p>
              <p className="text-muted-foreground">or</p>
              <div>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                  disabled={isUploading}
                />
                <Label htmlFor="file-upload">
                  <Button variant="outline" disabled={isUploading} asChild>
                    <span className="cursor-pointer">
                      {isUploading ? 'Uploading...' : 'Browse Files'}
                    </span>
                  </Button>
                </Label>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading and processing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Uploaded Files ({uploadedFiles.length})
          </CardTitle>
          <CardDescription>
            Manage your uploaded historical data files
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploadedFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No files uploaded yet</p>
              <p className="text-sm">Upload CSV files to get started with historical data analysis</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <Card key={file.id} className="relative">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{file.name}</h4>
                          <Badge variant={
                            file.status === 'completed' ? 'default' :
                            file.status === 'processing' ? 'secondary' : 'destructive'
                          }>
                            {file.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {file.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {file.status}
                          </Badge>
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          <span>{file.uploadDate.toLocaleDateString()}</span>
                          {file.status === 'completed' && (
                            <span>{file.rows.toLocaleString()} rows</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteFile(file.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {file.status === 'completed' && file.columns.length > 0 && (
                      <>
                        <Separator className="my-4" />
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-medium mb-2">Columns ({file.columns.length})</h5>
                            <div className="flex flex-wrap gap-1">
                              {file.columns.map((column, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {column}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {file.preview && file.preview.length > 0 && (
                            <div>
                              <h5 className="font-medium mb-2">Data Preview</h5>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm border rounded">
                                  <thead>
                                    <tr className="border-b bg-muted/50">
                                      {file.columns.map((column, index) => (
                                        <th key={index} className="text-left p-2 font-medium">
                                          {column}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {file.preview.map((row, rowIndex) => (
                                      <tr key={rowIndex} className="border-b">
                                        {file.columns.map((column, colIndex) => (
                                          <td key={colIndex} className="p-2">
                                            {row[column]}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sample Data Download */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Data</CardTitle>
          <CardDescription>
            Download sample CSV files to understand the expected format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download EUR/USD Sample
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download GBP/USD Sample
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}