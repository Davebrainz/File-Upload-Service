import { useEffect, useMemo, useState } from 'react';
import { validateUpload, buildShareUrl } from './lib/fileValidation.js';
import { submitAuthRequest } from './lib/authFlow.js';
import { apiFetch, buildApiUrl } from './lib/apiClient.js';

const initialState = {
  selectedFile: null,
  uploadState: 'idle',
  message: '',
  shareUrl: '',
  fileMeta: null,
  previewUrl: '',
};

const initialAuthState = {
  mode: 'signup',
  email: '',
  password: '',
  username: '',
  loading: false,
  message: '',
  isAuthenticated: false,
  userEmail: '',
  usernameSet: false,
  activeTab: 'upload',
};

function formatBytes(bytes) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export default function FileUploadService() {
  const [state, setState] = useState(initialState);
  const [authState, setAuthState] = useState(initialAuthState);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await apiFetch('/api/auth/status');
        const payload = await response.json();

        if (payload.hasAccount) {
          setAuthState((prev) => ({...prev, mode: 'signin', message: 'An account already exists. Please sign in.' }));
        }
      } catch (error) {
        console.error(error);
      }
    };

    checkAuthStatus();
  }, []);

  const fileTypeLabel = useMemo(() => {
    if (!state.selectedFile) return 'No file selected';
    const name = state.selectedFile.name || '';
    const extension = name.includes('.')? name.slice(name.lastIndexOf('.')).toLowerCase() : '';
    return `${extension || 'file'} • ${formatBytes(state.selectedFile.size)}`;
  }, [state.selectedFile]);

  const onFileSelect = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setState({...initialState, message: 'Please choose a file to upload.' });
      return;
    }

    const validation = validateUpload(file);
    if (!validation.valid) {
      setState({...initialState, message: validation.error, uploadState: 'error' });
      return;
    }

    setState({
     ...initialState,
      selectedFile: file,
      uploadState: 'ready',
      fileMeta: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      previewUrl: file.type.startsWith('image/')? URL.createObjectURL(file) : '',
      message: 'File is ready to upload.',
    });
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    if (!authState.email ||!authState.password) {
      setAuthState((prev) => ({...prev, message: 'Please enter both email and password.' }));
      return;
    }

    setAuthState((prev) => ({...prev, loading: true, message: '' }));

    try {
      const result = await submitAuthRequest({
        mode: authState.mode,
        email: authState.email,
        password: authState.password,
        username: authState.username,
      });

      setAuthState((prev) => ({
       ...prev,
        loading: false,
        message: result.payload.message || 'Success.',
        isAuthenticated: true,
        userEmail: authState.email,
        username: result.payload.user?.username || authState.username,
        usernameSet: Boolean(result.payload.user?.username || authState.username),
      }));

      if (authState.mode === 'signup' || result.usedFallback) {
        setAuthState((prev) => ({...prev, mode: 'signin' }));
      }
    } catch (error) {
      setAuthState((prev) => ({
       ...prev,
        loading: false,
        message: error.message || 'Authentication failed.',
      }));
    }
  };

  const handleUsernameSave = async (event) => {
    event.preventDefault();

    if (!authState.userEmail ||!authState.username.trim()) {
      setAuthState((prev) => ({...prev, message: 'Choose a username before saving it.' }));
      return;
    }

    setAuthState((prev) => ({...prev, loading: true, message: '' }));

    try {
      const response = await apiFetch('/api/auth/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authState.userEmail, username: authState.username.trim() }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Could not save the username.');
      }

      setAuthState((prev) => ({
       ...prev,
        loading: false,
        message: payload.message || 'Username saved.',
        username: payload.user?.username || prev.username,
        usernameSet: true,
      }));
    } catch (error) {
      setAuthState((prev) => ({
       ...prev,
        loading: false,
        message: error.message || 'Could not save the username.',
      }));
    }
  };

  const onUpload = async () => {
    if (!state.selectedFile) {
      setState((prev) => ({...prev, message: 'Please select a file first.', uploadState: 'error' }));
      return;
    }

    setState((prev) => ({...prev, uploadState: 'uploading', message: 'Uploading file...' }));

    const formData = new FormData();
    formData.append('file', state.selectedFile);

    try {
      const response = await apiFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Upload failed.');
      }

      const payload = await response.json();
      const shareUrl = payload.url || buildShareUrl(buildApiUrl('/share'), payload.id || 'unknown');

      setState((prev) => ({
       ...prev,
        uploadState: 'success',
        message: 'Upload complete. Share this link securely.',
        shareUrl,
        previewUrl: prev.selectedFile?.type?.startsWith('image/')? shareUrl : prev.previewUrl,
      }));
    } catch (error) {
      setState((prev) => ({
       ...prev,
        uploadState: 'error',
        message: error.message || 'Upload failed. Please try again.',
      }));
    }
  };

  return (
    // CHANGED: Full width centered layout + more spacing
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="upload-card bg-black/30 backdrop-blur-lg rounded-2xl p-8 md:p-12 space-y-6 shadow-2xl">
          {!authState.isAuthenticated? (
            <form className="auth-form" onSubmit={handleAuthSubmit}>
              <div className="auth-header">
                <h2>{authState.mode === 'signup'? 'Create account' : 'Sign in'}</h2>
                <p>{authState.mode === 'signup'? 'Create an account to get started.' : 'Welcome back. Sign in to continue.'}</p>
              </div>

              <label className="field-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={authState.email}
                onChange={(event) => setAuthState((prev) => ({...prev, email: event.target.value }))}
                placeholder="you@example.com"
              />

              <label className="field-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={authState.password}
                onChange={(event) => setAuthState((prev) => ({...prev, password: event.target.value }))}
                placeholder="Enter password"
              />

              <label className="field-label" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={authState.username}
                onChange={(event) => setAuthState((prev) => ({...prev, username: event.target.value }))}
                placeholder="Choose a username"
              />

              <button type="submit" className="primary-btn" disabled={authState.loading}>
                {authState.loading? 'Please wait...' : authState.mode === 'signup'? 'Sign up' : 'Sign in'}
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => setAuthState((prev) => ({
                 ...prev,
                  mode: prev.mode === 'signup'? 'signin' : 'signup',
                  message: prev.mode === 'signup'? 'Use your saved account to sign in.' : 'Create a new account.'
                }))}
              >
                {authState.mode === 'signup'? 'Already have an account? Sign in' : 'Need an account? Sign up'}
              </button>

              {authState.message && <div className="status-message info">{authState.message}</div>}
            </form>
          ) : (
            <>
              <div className="topbar">
                <button
                  type="button"
                  className="secondary-btn topbar-btn"
                  onClick={() => setAuthState({...initialAuthState, mode: 'signin', message: 'You have been logged out.' })}
                >
                  Log out
                </button>
              </div>

              <div className="auth-welcome">
                <p>{authState.usernameSet? `@${authState.username}` : authState.userEmail}</p>
                <h2>Welcome back</h2>
              </div>

              <div className="tab-bar" role="tablist" aria-label="Account sections">
                <button
                  type="button"
                  className={`tab-btn ${authState.activeTab === 'upload'? 'active' : ''}`}
                  onClick={() => setAuthState((prev) => ({...prev, activeTab: 'upload' }))}
                >
                  Upload
                </button>
                <button
                  type="button"
                  className={`tab-btn ${authState.activeTab === 'profile'? 'active' : ''}`}
                  onClick={() => setAuthState((prev) => ({...prev, activeTab: 'profile' }))}
                >
                  Profile
                </button>
              </div>

              {authState.activeTab === 'profile'? (
                <form className="auth-form" onSubmit={handleUsernameSave}>
                  <div className="auth-header">
                    <h2>Set up your username</h2>
                    <p>This username will be saved with your account details.</p>
                  </div>

                  <label className="field-label" htmlFor="profile-username">Username</label>
                  <input
                    id="profile-username"
                    type="text"
                    value={authState.username}
                    onChange={(event) => setAuthState((prev) => ({...prev, username: event.target.value }))}
                    placeholder="Choose a username"
                  />

                  <button type="submit" className="primary-btn" disabled={authState.loading}>
                    {authState.loading? 'Saving...' : 'Save username'}
                  </button>

                  {authState.message && <div className="status-message info">{authState.message}</div>}
                </form>
              ) : (
                <>
                  <label className="upload-box" htmlFor="file-input">
                    <span className="upload-title">Upload File</span>
                    <span className="upload-subtitle">Choose a JPG, PNG, WEBP, or PDF up to 50MB</span>
                    <input id="file-input" type="file" onChange={onFileSelect} accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" />
                  </label>

                  <div className="selection-meta" aria-live="polite">
                    <strong>{fileTypeLabel}</strong>
                  </div>

                  <button type="button" className="primary-btn" onClick={onUpload} disabled={state.uploadState === 'uploading'}>
                    {state.uploadState === 'uploading'? 'Uploading...' : 'Upload'}
                  </button>

                  <div className={`status-message ${state.uploadState}`} role="status">
                    {state.message}
                  </div>

                  {state.shareUrl && (
                    <div className="share-box">
                      <label htmlFor="share-link">Shareable link</label>
                      <input id="share-link" value={state.shareUrl} readOnly />
                      <div className="action-row">
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => navigator.clipboard?.writeText(state.shareUrl)}
                        >
                          Copy link
                        </button>
                        <a className="action-link" href={state.shareUrl} target="_blank" rel="noreferrer">
                          Open link
                        </a>
                        <a
                          className="action-link"
                          href={state.shareUrl}
                          download={state.fileMeta?.name || 'uploaded-file'}
                        >
                          Download file
                        </a>
                      </div>
                      {state.previewUrl && (
                        <div className="preview-frame">
                          {state.fileMeta?.type === 'application/pdf'? (
                            <iframe src={state.previewUrl} title="Uploaded PDF preview" className="preview-iframe" />
                          ) : (
                            <img src={state.previewUrl} alt="Uploaded preview" className="preview-image" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}