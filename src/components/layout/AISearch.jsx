import React, { useState } from 'react';
import { InvokeLLM } from '@/api/integrations';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Send } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function AISearch() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query) return;

        setIsLoading(true);
        setResult(null);
        setError(null);

        const prompt = `
            You are an AI assistant for the "WWFH Fleet" management application.
            Your goal is to help the user navigate to the correct page based on their query.

            Here are the available pages and their functions:
            - "Dashboard": Overview of fleet status, workflows, and metrics.
            - "Fleet": View and manage all vehicles in the fleet.
            - "Calendar": A calendar view of vehicle availability and bookings.
            - "Quoting": Create and send quotes for vehicle hires.
            - "Checkout": The step-by-step process for checking a vehicle out to a customer.
            - "Checkin": The step-by-step process for a returning vehicle.
            - "Search": A simple search to find a specific vehicle and its history.
            - "Admin": Manage core system settings like Vehicle Types, Pricing Rules (including insurance, KM allowances, additional services), and Locations.

            User Query: "${query}"

            Based on the user's query, determine the single best page they should navigate to.
            For example, if the user asks "change insurance prices", the best page is "Admin".
            If they ask "see all my utes", the best page is "Fleet".
        `;

        const response_json_schema = {
            type: "object",
            properties: {
                page: {
                    type: "string",
                    description: "The name of the single best page that matches the user's query.",
                    enum: ["Dashboard", "Fleet", "Calendar", "Quoting", "Checkout", "Checkin", "Search", "Admin"]
                },
                reasoning: {
                    type: "string",
                    description: "A very short, user-friendly explanation for why this page was chosen."
                }
            },
            required: ["page", "reasoning"]
        };

        try {
            const response = await InvokeLLM({ prompt, response_json_schema });
            setResult(response);
        } catch (err) {
            console.error("AI search failed:", err);
            setError("Sorry, I couldn't understand that. Please try rephrasing your request.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavigate = () => {
        if (result?.page) {
            navigate(createPageUrl(result.page));
            setResult(null);
            setQuery('');
        }
    };
    
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-slate-500 rounded-[30px]">
                    fleethub AI companion, search eveything you need here...
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4">
                <form onSubmit={handleSearch} className="space-y-3">
                    <label className="text-sm font-medium text-slate-800">What do you need to do?</label>
                    <div className="flex gap-2">
                       <Input 
                            placeholder="e.g., 'adjust daily rates'"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="rounded-[30px]"  // Add this line
                        />
                        <Button type="submit" size="icon" disabled={isLoading}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </form>
                {isLoading && <p className="text-sm text-slate-500 mt-3 animate-pulse">Thinking...</p>}
                {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
                {result && (
                    <div className="mt-4 space-y-3">
                        <p className="text-sm text-slate-700 bg-slate-100 p-2 rounded-md">
                           <span className="font-semibold">Suggestion:</span> {result.reasoning}
                        </p>
                        <Button onClick={handleNavigate} className="w-full">
                            Go to {result.page} page
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}