import React from 'react';

/**
 * Filter tabs for filtering sales by crop
 */
function CropFilterTabs({
    uniqueCrops,
    selectedCropFilter,
    onFilterChange,
    totalCount
}) {
    return (
        <div className="mb-6">
            <div className="w-full">
                <div className="flex flex-wrap gap-3 items-center">
                    <span className="text-gray-500 ml-2 font-medium">
                        <i className="bi bi-funnel ml-1"></i>فلترة:
                    </span>
                    <button
                        className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-full transition-colors ${selectedCropFilter === 'all'
                                ? 'bg-indigo-600 text-white border-transparent shadow-sm'
                                : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                            }`}
                        onClick={() => onFilterChange('all')}
                    >
                        الكل ({totalCount})
                    </button>
                    {uniqueCrops.map(({ crop, count }) => (
                        <button
                            key={crop.crop_id}
                            className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-full transition-colors ${selectedCropFilter === crop.crop_id
                                    ? 'bg-emerald-600 text-white border-transparent shadow-sm'
                                    : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                }`}
                            onClick={() => onFilterChange(crop.crop_id)}
                        >
                            <i className="bi bi-flower1 ml-1.5"></i>
                            {crop.crop_name} ({count})
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CropFilterTabs;
