"use client";

import React from 'react';

export function DebugGrid() {
  return (
    <div className="flex flex-col h-full w-full border border-gray-700 rounded-md">
      <div className="flex items-center justify-between p-2 bg-[#232326] border-b border-gray-700">
        <div className="text-white text-sm">Debug Grid</div>
      </div>
      
      <div className="flex-1 flex items-center justify-center bg-[#1e1e20] p-4 text-white">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Debug Grid Placeholder</h3>
          <p className="text-sm text-gray-400 mb-4">
            AG-Grid has been removed. Ready for new grid library implementation.
          </p>
        </div>
      </div>
    </div>
  );
} 