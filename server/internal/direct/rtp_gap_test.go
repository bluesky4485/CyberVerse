package direct

import (
	"testing"
	"time"
)

func TestCappedRTPGap(t *testing.T) {
	t.Parallel()
	if got := cappedRTPGap(10 * time.Second); got != maxRTPTimestampGap {
		t.Fatalf("expected cap %v, got %v", maxRTPTimestampGap, got)
	}
	if got := cappedRTPGap(500 * time.Millisecond); got != 500*time.Millisecond {
		t.Fatalf("expected 500ms, got %v", got)
	}
}

func TestRTPGapThresholdUsesFrameDuration(t *testing.T) {
	t.Parallel()
	frameDur := time.Second / 25
	if got := rtpGapThreshold(frameDur); got != 2*frameDur {
		t.Fatalf("expected %v, got %v", 2*frameDur, got)
	}
}

func TestRTPGapToSkip(t *testing.T) {
	t.Parallel()
	frameDur := 50 * time.Millisecond

	if got := rtpGapToSkip(90*time.Millisecond, frameDur); got != 0 {
		t.Fatalf("expected no skip below threshold, got %v", got)
	}
	if got := rtpGapToSkip(500*time.Millisecond, frameDur); got != 500*time.Millisecond {
		t.Fatalf("expected 500ms skip, got %v", got)
	}
	if got := rtpGapToSkip(36*time.Second, frameDur); got != maxRTPTimestampGap {
		t.Fatalf("expected capped skip %v, got %v", maxRTPTimestampGap, got)
	}
}
