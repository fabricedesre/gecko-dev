/* Copyright 2012 Mozilla Foundation and Mozilla contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#ifndef nsWindow_h
#define nsWindow_h

#include "InputData.h"
#include "mozilla/UniquePtr.h"
#include "nsBaseWidget.h"
#include "nsRegion.h"
#include "nsIIdleServiceInternal.h"
#include "Units.h"

class ANativeWindowBuffer;

namespace mozilla {
namespace dom {
class AnonymousContent;
}
namespace gfx {
class SourceSurface;
}

namespace layers {
class Composer2D;
}

class HwcComposer2D;
}

namespace widget {
struct InputContext;
struct InputContextAction;
}

class nsScreenGonk;
class GLCursorImageManager;

class nsWindow : public nsBaseWidget
{
public:
  nsWindow();

  NS_DECL_ISUPPORTS_INHERITED

  static void DoDraw(void);
  static nsEventStatus DispatchKeyInput(mozilla::WidgetKeyboardEvent& aEvent);
  static void DispatchTouchInput(mozilla::MultiTouchInput& aInput);
  static void SetMouseDevice(bool aMouse);
  static void NotifyHoverMove(const ScreenIntPoint& point);
  static void KickOffComposition();

  using nsBaseWidget::Create; // for Create signature not overridden here
  NS_IMETHOD Create(nsIWidget* aParent,
                    void* aNativeParent,
                    const LayoutDeviceIntRect& aRect,
                    nsWidgetInitData* aInitData) override;
  void Destroy(void) override;

  void Show(bool aState) override;
  virtual bool IsVisible() const override;
  void ConstrainPosition(bool aAllowSlop, int32_t* aX, int32_t* aY) override;
  void Move(double aX, double aY) override;
  void Resize(double aWidth, double aHeight, bool aRepaint) override;
  void Resize(double aX,
                    double aY,
                    double aWidth,
                    double aHeight,
                    bool aRepaint) override;
  void Enable(bool aState) override;
  virtual bool IsEnabled() const override;
  virtual void SetFocus(Raise) override;
  NS_IMETHOD ConfigureChildren(const nsTArray<nsIWidget::Configuration>&) override;
  void Invalidate(const LayoutDeviceIntRect& aRect) override;
  virtual void* GetNativeData(uint32_t aDataType) override;
  virtual void SetNativeData(uint32_t aDataType, uintptr_t aVal) override;
  NS_IMETHOD SetTitle(const nsAString& aTitle)  override { return NS_OK; }
  virtual LayoutDeviceIntPoint WidgetToScreenOffset() override;
  void DispatchTouchInputViaAPZ(mozilla::MultiTouchInput& aInput);
  void DispatchTouchEventForAPZ(const mozilla::MultiTouchInput& aInput,
                                const ScrollableLayerGuid& aGuid,
                                const uint64_t aInputBlockId,
                                nsEventStatus aApzResponse);
  NS_IMETHOD DispatchEvent(mozilla::WidgetGUIEvent* aEvent,
                           nsEventStatus& aStatus) override;
  virtual nsresult SynthesizeNativeTouchPoint(uint32_t aPointerId,
                                              TouchPointerState aPointerState,
                                              LayoutDeviceIntPoint aPoint,
                                              double aPointerPressure,
                                              uint32_t aPointerOrientation,
                                              nsIObserver* aObserver) override;

  void CaptureRollupEvents(nsIRollupListener* aListener, bool aDoCapture) override
  {
  }
  void ReparentNativeWidget(nsIWidget* aNewParent) override;

  NS_IMETHOD MakeFullScreen(bool aFullScreen,
                            nsIScreen* aTargetScreen = nullptr) override;

  virtual already_AddRefed<mozilla::gfx::DrawTarget> StartRemoteDrawing()
    override;
  virtual void EndRemoteDrawing() override;

  void SetCursor(nsCursor aDefaultCursor, imgIContainer* aCursor,
                       uint32_t aHotspotX,
                       uint32_t aHotspotY) override
  {
  }

  void UpdateCursorSourceMap(nsCursor aCursor);
  already_AddRefed<mozilla::gfx::SourceSurface> RestyleCursorElement(
    nsCursor aCursor);

  virtual float GetDPI() override;
  virtual bool IsVsyncSupported();
  virtual double GetDefaultScaleInternal() override;
  virtual mozilla::layers::LayerManager* GetLayerManager(
    PLayerTransactionChild* aShadowManager = nullptr,
    LayersBackend aBackendHint = mozilla::layers::LayersBackend::LAYERS_NONE,
    LayerManagerPersistence aPersistence = LAYER_MANAGER_CURRENT) override;
  virtual void DestroyCompositor() override;

  virtual CompositorBridgeParent* NewCompositorBridgeParent(int aSurfaceWidth,
                                                            int aSurfaceHeight);

  NS_IMETHOD_(void)
  SetInputContext(const InputContext& aContext,
                  const InputContextAction& aAction) override;
  NS_IMETHOD_(InputContext) GetInputContext() override;

  virtual uint32_t GetGLFrameBufferFormat() override;

  virtual LayoutDeviceIntRect GetNaturalBounds() override;
  virtual bool NeedsPaint() override;

  mozilla::layers::Composer2D* GetComposer2D();

  // FIXME void ConfigureAPZControllerThread() override;

  nsScreenGonk* GetScreen();

  // Call this function after remote control use nsContentUtils::SendMouseEvent
  virtual void SetMouseCursorPosition(const ScreenIntPoint& aScreenIntPoint);

protected:
  nsWindow* mParent;
  bool mVisible;
  InputContext mInputContext;
  nsCOMPtr<nsIIdleServiceInternal> mIdleService;

  virtual ~nsWindow();

  void BringToTop();

  // Call this function when the users activity is the direct cause of an
  // event (like a keypress or mouse click).
  void UserActivity();

  void DrawWindowOverlay(mozilla::widget::WidgetRenderingContext* aContext,
                         LayoutDeviceIntRect aRect) override;

private:
  void EnsureGLCursorImageManager();

  // This is used by SynthesizeNativeTouchPoint to maintain state between
  // multiple synthesized points
  mozilla::UniquePtr<mozilla::MultiTouchInput> mSynthesizedTouchInput;

  RefPtr<nsScreenGonk> mScreen;

  RefPtr<mozilla::HwcComposer2D> mComposer2D;

  // 1. This member variable would be accessed by main and compositor thread.
  // 2. Currently there is a lock in GLCursorImageManager to protect it's data
  //    between two threads already.
  // 3. For variable itself, currently there is no protection because compo-
  //    sitor thread will call GLCursorImageManager::ShouldDrawGLCursor() to
  //    check whether it is ready for drawing. Which is protected as mentioned
  //    above. On the other hand the timing it becomes nullptr is inside
  //    destructor of nsWindow and the one access it on compositor thread owns
  //    strong reference of nsWindow so it is impossible to be happened.
  // nsAutoPtr<GLCursorImageManager> mGLCursorImageManager;

  virtual bool IsBelongedToPrimaryScreen();
};

#endif /* nsWindow_h */
