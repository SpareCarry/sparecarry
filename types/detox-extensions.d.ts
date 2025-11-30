import "detox";

declare global {
  namespace Detox {
    interface IndexableNativeElement {
      or(matcher: Detox.NativeMatcher): Detox.IndexableNativeElement;
    }

    interface NativeElementActions {
      or?(matcher: Detox.NativeMatcher): Detox.IndexableNativeElement;
    }
  }
}
