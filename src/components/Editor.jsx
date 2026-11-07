import { useState, useEffect } from 'react';
import { db, CLOUD, PRESET } from '../firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { SEC, EXTRA, md } from '../constants';
import { useToast } from './Toast';

const DRAFT_KEY = 'paradiso-editor-draft';

/**
 * Load auto-saved draft from localStorage.
 */
function loadDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return null;
}

/**
 * Save draft to localStorage.
 */
function saveDraft(data) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * Clear saved draft.
 */
function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

/**
 * Editor component for creating and editing entries.
 * Features: validation, auto-save draft, image upload, markdown preview.
 */
export default function Editor({ init, done }) {
  const toast = useToast();
  const [f, setF] = useState(() => {
    if (init) return init;
    const draft = loadDraft();
    return draft || { type: 'post', title: '', body: '', image: '', extra: '' };
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  // Auto-save draft on change (only for new entries)
  useEffect(() => {
    if (!init) {
      saveDraft(f);
    }
  }, [f, init]);

  const setField = (key) => (e) => {
    setF({ ...f, [key]: e.target.value });
    // Clear error for this field when user types
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!f.title.trim()) newErrors.title = 'Title is required';
    if (!f.body.trim()) newErrors.body = 'Content is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const save = async () => {
    if (!validate()) {
      toast('Please fill in required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const { id, date, ...data } = f;
      if (id) {
        await updateDoc(doc(db, 'entries', id), data);
        toast('Entry updated', 'success');
      } else {
        await addDoc(collection(db, 'entries'), {
          ...data,
          date: serverTimestamp(),
        });
        toast('Entry saved', 'success');
      }
      clearDraft();
      done();
    } catch (err) {
      toast('Failed to save: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', PRESET);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
        { method: 'POST', body: fd }
      );
      const json = await res.json();
      if (json.secure_url) {
        setF({ ...f, image: json.secure_url });
        toast('Image uploaded', 'success');
      } else {
        throw new Error(json.error?.message || 'Upload failed');
      }
    } catch (err) {
      toast('Image upload failed: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (!init) clearDraft();
    done();
  };

  return (
    <div className="ed">
      <select value={f.type} onChange={setField('type')}>
        {SEC.map(([k, n]) => (
          <option key={k} value={k}>
            {n}
          </option>
        ))}
      </select>

      <input
        placeholder="title *"
        value={f.title}
        onChange={setField('title')}
        className={errors.title ? 'input-error' : ''}
      />
      {errors.title && <span className="field-error">{errors.title}</span>}

      {EXTRA[f.type] && (
        <input
          placeholder={EXTRA[f.type]}
          value={f.extra || ''}
          onChange={setField('extra')}
        />
      )}

      <input
        placeholder="image url (or upload below)"
        value={f.image || ''}
        onChange={setField('image')}
      />
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <small>uploading image…</small>}

      <div className="split">
        <div>
          <textarea
            placeholder="write in markdown… *"
            value={f.body}
            onChange={setField('body')}
            className={errors.body ? 'input-error' : ''}
          />
          {errors.body && <span className="field-error">{errors.body}</span>}
        </div>
        <div className="md preview-pane" dangerouslySetInnerHTML={md(f.body)} />
      </div>

      <div className="editor-actions">
        <button onClick={save} disabled={saving}>
          {saving ? 'saving…' : 'save'}
        </button>
        <button onClick={handleCancel}>cancel</button>
      </div>
    </div>
  );
}
