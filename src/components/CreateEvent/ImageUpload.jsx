import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function ImageUpload({ value, onChange }) {
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    const handleFile = async (file) => {
        if (!file) return;
        setError('');

        if (!file.type.startsWith('image/')) {
            setError('Only image files are accepted.');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setError('Image must be under 5 MB.');
            return;
        }

        setUploading(true);
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from('event-images')
            .upload(path, file, { contentType: file.type });

        if (uploadError) {
            setError(uploadError.message);
            setUploading(false);
            return;
        }

        const { data } = supabase.storage.from('event-images').getPublicUrl(path);
        onChange(data.publicUrl);
        setUploading(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = (e) => {
        // Only clear if leaving the zone entirely (not a child element)
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragging(false);
        }
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        onChange('');
        setError('');
    };

    return (
        <div
            className={`image-upload-zone${dragging ? ' dragging' : ''}${value ? ' has-image' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !value && !uploading && inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files[0])}
            />

            {uploading ? (
                <div className="upload-status">
                    <div className="upload-spinner" />
                    <span>Uploading...</span>
                </div>
            ) : value ? (
                <div className="upload-preview">
                    <img src={value} alt="Event preview" />
                    <button type="button" className="upload-remove" onClick={handleRemove}>
                        Remove
                    </button>
                </div>
            ) : (
                <div className="upload-prompt">
                    <div className="upload-icon">↑</div>
                    <p>Drop image here or <span className="upload-browse">browse</span></p>
                    <small>JPG, PNG, WebP · max 5 MB</small>
                </div>
            )}

            {error && <p className="upload-error">{error}</p>}
        </div>
    );
}
