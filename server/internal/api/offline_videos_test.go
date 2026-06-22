package api

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/cyberverse/server/internal/character"
	"github.com/cyberverse/server/internal/inference"
	pb "github.com/cyberverse/server/internal/pb"
)

func TestLocalOfflineVideoTextUsesOfflineTTSPreferenceNotOmniVoice(t *testing.T) {
	inf := &fakeInferenceService{
		ttsConfigs: make(chan inference.TTSConfig, 1),
		ttsChunks: []*pb.AudioChunk{{
			Data:       []byte{0, 0, 1, 0},
			SampleRate: 16000,
			Channels:   1,
			Format:     "pcm_s16le",
		}},
	}
	r := newTestRouterWithInference(inf)
	char, err := r.charStore.Create(&character.Character{
		Name:          "Offline Voice",
		VoiceProvider: "qwen_omni",
		VoiceType:     "Tina",
		OfflineVideoTTS: &character.OfflineVideoTTS{
			Provider: "qwen",
			Voice:    "Momo",
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	addOfflineVideoAvatarImage(t, r.charStore, char.ID)

	req := newOfflineVideoMultipartRequest(t, char.ID, map[string]string{
		"input_type": "text",
		"text":       "hello from offline",
	})
	w := httptest.NewRecorder()
	r.Handler().ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}

	select {
	case cfg := <-inf.ttsConfigs:
		if cfg.Provider != "qwen" || cfg.Voice != "Momo" {
			t.Fatalf("expected offline tts qwen/Momo, got %+v", cfg)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for tts config")
	}
}

func TestLocalOfflineVideoTextFormTTSOverridesPreference(t *testing.T) {
	r := newTestRouter()
	char := &character.Character{
		OfflineVideoTTS: &character.OfflineVideoTTS{
			Provider: "qwen",
			Voice:    "Momo",
		},
	}
	req := newOfflineVideoMultipartRequest(t, "character-id", map[string]string{
		"input_type":   "text",
		"text":         "hello",
		"tts_provider": "qwen",
		"tts_voice":    "Cherry",
	})

	cfg, err := r.offlineVideoTTSConfig(req, char, "text", "offline-job")
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Provider != "qwen" || cfg.Voice != "Cherry" {
		t.Fatalf("expected form tts qwen/Cherry, got %+v", cfg)
	}
}

func TestLocalOfflineVideoTextFallsBackToDefaultTTS(t *testing.T) {
	r := newTestRouter()
	req := newOfflineVideoMultipartRequest(t, "character-id", map[string]string{
		"input_type": "text",
		"text":       "hello",
	})

	cfg, err := r.offlineVideoTTSConfig(req, &character.Character{}, "text", "offline-job")
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Provider != "qwen" || cfg.Voice != "Momo" {
		t.Fatalf("expected default qwen/Momo, got %+v", cfg)
	}
}

func TestLocalOfflineVideoAudioSkipsTTSProviderValidation(t *testing.T) {
	r := newTestRouter()
	req := newOfflineVideoMultipartRequest(t, "character-id", map[string]string{
		"input_type":   "audio",
		"tts_provider": "not-configured",
	})

	cfg, err := r.offlineVideoTTSConfig(req, &character.Character{}, "audio", "offline-job")
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Provider != "" || cfg.Voice != "" || cfg.SessionID != "offline-job" {
		t.Fatalf("expected empty audio tts config with session id, got %+v", cfg)
	}
}

func TestBaiduXilingOfflineVideoOptionsUseBaiduTTSParams(t *testing.T) {
	t.Setenv("BAIDU_XILING_OFFLINE_TTS_PERSON", "")
	t.Setenv("BAIDU_XILING_OFFLINE_TTS_LAN", "")
	t.Setenv("BAIDU_XILING_OFFLINE_TTS_SPEED", "")
	t.Setenv("BAIDU_XILING_OFFLINE_TTS_VOLUME", "")
	t.Setenv("BAIDU_XILING_OFFLINE_TTS_PITCH", "")

	req := newOfflineVideoMultipartRequest(t, "character-id", map[string]string{
		"tts_provider": "qwen",
		"tts_voice":    "Momo",
		"tts_person":   "baidu-person-1",
		"tts_lan":      "English",
		"tts_speed":    "7",
		"tts_volume":   "8",
		"tts_pitch":    "9",
	})

	options := baiduXilingOfflineVideoOptionsFromRequest(req, &character.Character{
		BaiduXiling: &character.BaiduXiling{Width: 720, Height: 406},
		OfflineVideoTTS: &character.OfflineVideoTTS{
			Provider: "qwen",
			Voice:    "Momo",
		},
	})
	if options.TTSPerson != "baidu-person-1" ||
		options.TTSLan != "English" ||
		options.TTSSpeed != "7" ||
		options.TTSVolume != "8" ||
		options.TTSPitch != "9" {
		t.Fatalf("expected Baidu TTS params to be preserved, got %+v", options)
	}
}

func addOfflineVideoAvatarImage(t *testing.T, store *character.Store, characterID string) {
	t.Helper()
	image := character.ImageInfo{
		Filename: "avatar.png",
		OrigName: "avatar.png",
		AddedAt:  time.Now().UTC().Format(time.RFC3339),
	}
	if err := os.WriteFile(filepath.Join(store.ImagesDir(characterID), image.Filename), []byte("avatar"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := store.AddImage(characterID, image); err != nil {
		t.Fatal(err)
	}
}

func newOfflineVideoMultipartRequest(t *testing.T, characterID string, fields map[string]string) *http.Request {
	t.Helper()
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	for key, value := range fields {
		if err := writer.WriteField(key, value); err != nil {
			t.Fatal(err)
		}
	}
	if err := writer.Close(); err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest(http.MethodPost, "/api/v1/characters/"+characterID+"/offline-videos", &body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	return req
}
