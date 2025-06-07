"use client"
import { SendIcon } from "lucide-react"
import { Button } from "../ui/button"
import { useRef, useState, useEffect, ChangeEvent } from "react"
import { Textarea } from "../ui/textarea"

export const Textbox = () => {
    const [value, setValue] = useState("")
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Control the textarea height with a max limit
    useEffect(() => {
        const textarea = textareaRef.current
        if (!textarea) return
        textarea.style.height = "auto"
        // Calculate height based on content (scrollHeight)
        const newHeight = textarea.scrollHeight
        
        // Set a maximum height (4 lines worth of text)
        // Assuming ~24px per line with padding
        const maxHeight = 24 * 4 + 16 // 4 lines + padding
        
        // Apply height, capped at maxHeight
        textarea.style.height = Math.min(newHeight, maxHeight) + "px"
        
        // Enable scrolling if content exceeds maxHeight
        textarea.style.overflowY = newHeight > maxHeight ? "auto" : "hidden"
    }, [value])

    return (
        <div className="text-white w-xl border border-gray-500 rounded-xl p-3">
            <div className="flex flex-col w-full">
                <Textarea 
                    ref={textareaRef}
                    value={value}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value)}
                    placeholder="Enter your prompt"
                    className="text-white bg-black focus-visible:ring-0 focus-visible:ring-offset-0 border-none resize-none h-12 pr-6 custom-scrollbar"
                    rows={2}
                />
                <div className="flex justify-between items-center mt-2">
                    <p className="text-white text-sm">model</p>
                    <Button className="text-white bg-black border-none hover:border-white cursor-pointer">
                        <SendIcon size={20} />
                    </Button>
                </div>
            </div>
            
            {/* Add custom scrollbar styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #000000;
                    border-radius: 4px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #333333;
                    border-radius: 4px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #444444;
                }
            `}</style>
        </div>
    )
}