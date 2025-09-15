import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Code, Globe, Settings, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmbedGuide() {
    const [websiteUrl, setWebsiteUrl] = useState('https://yourwebsite.com');
    const [copied, setCopied] = useState(false);
    
    const embedUrl = `${window.location.origin}/EmbedQuote`;
    
    const basicIframe = `<iframe 
    src="${embedUrl}"
    width="100%" 
    height="800" 
    frameborder="0"
    style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
</iframe>`;

    const responsiveIframe = `<div style="position: relative; width: 100%; height: 0; padding-bottom: 75%; overflow: hidden;">
    <iframe 
        src="${embedUrl}"
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 8px;"
        allowfullscreen>
    </iframe>
</div>`;

    const modalCode = `<script>
function openQuoteModal() {
    const modal = document.createElement('div');
    modal.style.cssText = \`
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); z-index: 10000; display: flex;
        align-items: center; justify-content: center; padding: 20px;
    \`;
    
    const iframe = document.createElement('iframe');
    iframe.src = '${embedUrl}';
    iframe.style.cssText = \`
        width: 100%; max-width: 1200px; height: 90vh;
        border: none; border-radius: 12px; background: white;
    \`;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = \`
        position: absolute; top: 10px; right: 10px; 
        background: white; border: none; font-size: 24px;
        width: 40px; height: 40px; border-radius: 50%;
        cursor: pointer; z-index: 10001;
    \`;
    closeBtn.onclick = () => document.body.removeChild(modal);
    
    modal.appendChild(iframe);
    modal.appendChild(closeBtn);
    modal.onclick = (e) => e.target === modal && document.body.removeChild(modal);
    document.body.appendChild(modal);
}
</script>

<!-- Add this button anywhere on your page -->
<button onclick="openQuoteModal()" style="background: #CE202E; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
    Get Quote
</button>`;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{color: 'var(--wwfh-navy)'}}>
                        Embed Quote Builder
                    </h1>
                    <p className="text-lg text-slate-600">
                        Integrate the quote builder directly into your website using these embed options.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Preview */}
                    <div className="space-y-6">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-blue-600" />
                                    Live Preview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg overflow-hidden">
                                    <iframe 
                                        src={embedUrl}
                                        width="100%" 
                                        height="600"
                                        style={{border: 'none'}}
                                        title="Quote Builder Preview"
                                    />
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => window.open(embedUrl, '_blank')}
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Open in New Tab
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Configuration */}
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-slate-600" />
                                    Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Your Website URL</Label>
                                    <Input 
                                        value={websiteUrl}
                                        onChange={(e) => setWebsiteUrl(e.target.value)}
                                        placeholder="https://yourwebsite.com"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        This helps us track where quotes are coming from
                                    </p>
                                </div>
                                
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <h4 className="font-semibold text-blue-900 mb-2">Embed URL</h4>
                                    <code className="text-sm text-blue-800 break-all">
                                        {embedUrl}
                                    </code>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Embed Options */}
                    <div className="space-y-6">
                        {/* Basic Embed */}
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="flex items-center gap-2">
                                        <Code className="w-5 h-5 text-emerald-600" />
                                        Basic Embed
                                    </CardTitle>
                                    <Badge variant="outline">Recommended</Badge>
                                </div>
                                <p className="text-sm text-slate-600">
                                    Simple iframe that works on any website. Fixed height of 800px.
                                </p>
                            </CardHeader>
                            <CardContent>
                                <Textarea 
                                    value={basicIframe}
                                    readOnly
                                    rows={6}
                                    className="font-mono text-xs"
                                />
                                <Button 
                                    onClick={() => copyToClipboard(basicIframe)}
                                    className="mt-2 w-full"
                                    variant="outline"
                                >
                                    <Copy className="w-4 h-4 mr-2" />
                                    {copied ? 'Copied!' : 'Copy Code'}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Responsive Embed */}
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="flex items-center gap-2">
                                        <Code className="w-5 h-5 text-blue-600" />
                                        Responsive Embed
                                    </CardTitle>
                                    <Badge variant="secondary">Mobile Friendly</Badge>
                                </div>
                                <p className="text-sm text-slate-600">
                                    Automatically adjusts to container width and maintains aspect ratio.
                                </p>
                            </CardHeader>
                            <CardContent>
                                <Textarea 
                                    value={responsiveIframe}
                                    readOnly
                                    rows={6}
                                    className="font-mono text-xs"
                                />
                                <Button 
                                    onClick={() => copyToClipboard(responsiveIframe)}
                                    className="mt-2 w-full"
                                    variant="outline"
                                >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy Code
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Modal Embed */}
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="flex items-center gap-2">
                                        <Code className="w-5 h-5 text-purple-600" />
                                        Modal Popup
                                    </CardTitle>
                                    <Badge variant="secondary">Advanced</Badge>
                                </div>
                                <p className="text-sm text-slate-600">
                                    Opens the quote builder in a modal overlay. Includes a trigger button.
                                </p>
                            </CardHeader>
                            <CardContent>
                                <Textarea 
                                    value={modalCode}
                                    readOnly
                                    rows={8}
                                    className="font-mono text-xs"
                                />
                                <Button 
                                    onClick={() => copyToClipboard(modalCode)}
                                    className="mt-2 w-full"
                                    variant="outline"
                                >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy Code
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Instructions */}
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Integration Instructions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
                                    <li>Copy one of the embed codes above</li>
                                    <li>Paste it into your website's HTML where you want the quote builder to appear</li>
                                    <li>Save and publish your changes</li>
                                    <li>Test the integration to ensure it works properly</li>
                                </ol>
                                
                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
                                    <p className="text-sm text-amber-800">
                                        <strong>Note:</strong> Make sure your website allows iframe embeds. Some content management systems may require additional configuration.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}