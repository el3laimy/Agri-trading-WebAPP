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
        <div className="row mb-3">
            <div className="col-12">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                    <span className="text-muted me-2">
                        <i className="bi bi-funnel me-1"></i>فلترة:
                    </span>
                    <button
                        className={`btn btn-sm ${selectedCropFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => onFilterChange('all')}
                    >
                        الكل ({totalCount})
                    </button>
                    {uniqueCrops.map(({ crop, count }) => (
                        <button
                            key={crop.crop_id}
                            className={`btn btn-sm ${selectedCropFilter === crop.crop_id ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => onFilterChange(crop.crop_id)}
                        >
                            <i className="bi bi-flower1 me-1"></i>
                            {crop.crop_name} ({count})
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CropFilterTabs;
