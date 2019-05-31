/* -*- Mode: C++; tab-width: 20; indent-tabs-mode: nil; c-basic-offset: 4 -*- */
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

#include "nsLookAndFeel.h"
#include "nsStyleConsts.h"
#include "gfxFont.h"
#include "gfxFontConstants.h"
#include "mozilla/gfx/2D.h"
#include "cutils/properties.h"

static const char16_t UNICODE_BULLET = 0x2022;

nsLookAndFeel::nsLookAndFeel()
    : nsXPLookAndFeel()
{
}

nsLookAndFeel::~nsLookAndFeel()
{
}

nsresult
nsLookAndFeel::NativeGetColor(ColorID aID, nscolor &aColor)
{
    nsresult rv = NS_OK;

#define BASE_ACTIVE_COLOR     NS_RGB(0xaa,0xaa,0xaa)
#define BASE_NORMAL_COLOR     NS_RGB(0xff,0xff,0xff)
#define BASE_SELECTED_COLOR   NS_RGB(0xaa,0xaa,0xaa)
#define BG_ACTIVE_COLOR       NS_RGB(0xff,0xff,0xff)
#define BG_INSENSITIVE_COLOR  NS_RGB(0xaa,0xaa,0xaa)
#define BG_NORMAL_COLOR       NS_RGB(0xff,0xff,0xff)
#define BG_PRELIGHT_COLOR     NS_RGB(0xee,0xee,0xee)
#define BG_SELECTED_COLOR     NS_RGB(0x99,0x99,0x99)
#define DARK_NORMAL_COLOR     NS_RGB(0x88,0x88,0x88)
#define FG_INSENSITIVE_COLOR  NS_RGB(0x44,0x44,0x44)
#define FG_NORMAL_COLOR       NS_RGB(0x00,0x00,0x00)
#define FG_PRELIGHT_COLOR     NS_RGB(0x77,0x77,0x77)
#define FG_SELECTED_COLOR     NS_RGB(0xaa,0xaa,0xaa)
#define LIGHT_NORMAL_COLOR    NS_RGB(0xaa,0xaa,0xaa)
#define TEXT_ACTIVE_COLOR     NS_RGB(0x99,0x99,0x99)
#define TEXT_NORMAL_COLOR     NS_RGB(0x00,0x00,0x00)
#define TEXT_SELECTED_COLOR   NS_RGB(0x00,0x00,0x00)

    switch (aID) {
        // These colors don't seem to be used for anything anymore in Mozilla
        // (except here at least TextSelectBackground and TextSelectForeground)
        // The CSS2 colors below are used.
    case ColorID::WindowBackground:
        aColor = BASE_NORMAL_COLOR;
        break;
    case ColorID::WindowForeground:
        aColor = TEXT_NORMAL_COLOR;
        break;
    case ColorID::WidgetBackground:
        aColor = BG_NORMAL_COLOR;
        break;
    case ColorID::WidgetForeground:
        aColor = FG_NORMAL_COLOR;
        break;
    case ColorID::WidgetSelectBackground:
        aColor = BG_SELECTED_COLOR;
        break;
    case ColorID::WidgetSelectForeground:
        aColor = FG_SELECTED_COLOR;
        break;
    case ColorID::Widget3DHighlight:
        aColor = NS_RGB(0xa0,0xa0,0xa0);
        break;
    case ColorID::Widget3DShadow:
        aColor = NS_RGB(0x40,0x40,0x40);
        break;
    case ColorID::TextBackground:
        // not used?
        aColor = BASE_NORMAL_COLOR;
        break;
    case ColorID::TextForeground:
        // not used?
        aColor = TEXT_NORMAL_COLOR;
        break;
    case ColorID::TextSelectBackground:
        aColor = NS_RGBA(0x33,0xb5,0xe5,0x66);
        break;
    case ColorID::IMESelectedRawTextBackground:
    case ColorID::IMESelectedConvertedTextBackground:
        // still used
        aColor = BASE_SELECTED_COLOR;
        break;
    case ColorID::TextSelectForegroundCustom:
        aColor = NS_RGB(0x4d,0x4d,0x4d);
        break;
    case ColorID::TextSelectForeground:
        aColor = NS_CHANGE_COLOR_IF_SAME_AS_BG;
        break;
    case ColorID::IMESelectedRawTextForeground:
    case ColorID::IMESelectedConvertedTextForeground:
        // still used
        aColor = TEXT_SELECTED_COLOR;
        break;
    case ColorID::IMERawInputBackground:
    case ColorID::IMEConvertedTextBackground:
        aColor = NS_TRANSPARENT;
        break;
    case ColorID::IMERawInputForeground:
    case ColorID::IMEConvertedTextForeground:
        aColor = NS_SAME_AS_FOREGROUND_COLOR;
        break;
    case ColorID::IMERawInputUnderline:
    case ColorID::IMEConvertedTextUnderline:
        aColor = NS_SAME_AS_FOREGROUND_COLOR;
        break;
    case ColorID::IMESelectedRawTextUnderline:
    case ColorID::IMESelectedConvertedTextUnderline:
        aColor = NS_TRANSPARENT;
        break;
    case ColorID::SpellCheckerUnderline:
      aColor = NS_RGB(0xff, 0, 0);
      break;

        // css2  http://www.w3.org/TR/REC-CSS2/ui.html#system-colors
    case ColorID::Activeborder:
        // active window border
        aColor = BG_NORMAL_COLOR;
        break;
    case ColorID::Activecaption:
        // active window caption background
        aColor = BG_NORMAL_COLOR;
        break;
    case ColorID::Appworkspace:
        // MDI background color
        aColor = BG_NORMAL_COLOR;
        break;
    case ColorID::Background:
        // desktop background
        aColor = BG_NORMAL_COLOR;
        break;
    case ColorID::Captiontext:
        // text in active window caption, size box, and scrollbar arrow box (!)
        aColor = FG_NORMAL_COLOR;
        break;
    case ColorID::Graytext:
        // disabled text in windows, menus, etc.
        aColor = FG_INSENSITIVE_COLOR;
        break;
    case ColorID::Highlight:
        // background of selected item
        aColor = BASE_SELECTED_COLOR;
        break;
    case ColorID::Highlighttext:
        // text of selected item
        aColor = TEXT_SELECTED_COLOR;
        break;
    case ColorID::Inactiveborder:
        // inactive window border
        aColor = BG_NORMAL_COLOR;
        break;
    case ColorID::Inactivecaption:
        // inactive window caption
        aColor = BG_INSENSITIVE_COLOR;
        break;
    case ColorID::Inactivecaptiontext:
        // text in inactive window caption
        aColor = FG_INSENSITIVE_COLOR;
        break;
    case ColorID::Infobackground:
        // tooltip background color
        aColor = BG_NORMAL_COLOR;
        break;
    case ColorID::Infotext:
        // tooltip text color
        aColor = TEXT_NORMAL_COLOR;
        break;
    case ColorID::Menu:
        // menu background
        aColor = BG_NORMAL_COLOR;
        break;
    case ColorID::Menutext:
        // menu text
        aColor = TEXT_NORMAL_COLOR;
        break;
    case ColorID::Scrollbar:
        // scrollbar gray area
        aColor = BG_ACTIVE_COLOR;
        break;

    case ColorID::Threedface:
    case ColorID::Buttonface:
        // 3-D face color
        aColor = BG_NORMAL_COLOR;
        break;

    case ColorID::Buttontext:
        // text on push buttons
        aColor = TEXT_NORMAL_COLOR;
        break;

    case ColorID::Buttonhighlight:
        // 3-D highlighted edge color
    case ColorID::Threedhighlight:
        // 3-D highlighted outer edge color
        aColor = LIGHT_NORMAL_COLOR;
        break;

    case ColorID::Threedlightshadow:
        // 3-D highlighted inner edge color
        aColor = BG_NORMAL_COLOR;
        break;

    case ColorID::Buttonshadow:
        // 3-D shadow edge color
    case ColorID::Threedshadow:
        // 3-D shadow inner edge color
        aColor = DARK_NORMAL_COLOR;
        break;

    case ColorID::Threeddarkshadow:
        // 3-D shadow outer edge color
        aColor = NS_RGB(0,0,0);
        break;

    case ColorID::Window:
    case ColorID::Windowframe:
        aColor = BG_NORMAL_COLOR;
        break;

    case ColorID::Windowtext:
        aColor = FG_NORMAL_COLOR;
        break;

    case ColorID::MozEventreerow:
    case ColorID::MozField:
        aColor = BASE_NORMAL_COLOR;
        break;
    case ColorID::MozFieldtext:
        aColor = TEXT_NORMAL_COLOR;
        break;
    case ColorID::MozDialog:
        aColor = BG_NORMAL_COLOR;
        break;
    case ColorID::MozDialogtext:
        aColor = FG_NORMAL_COLOR;
        break;
    case ColorID::MozDragtargetzone:
        aColor = BG_SELECTED_COLOR;
        break;
    case ColorID::MozButtondefault:
        // default button border color
        aColor = NS_RGB(0,0,0);
        break;
    case ColorID::MozButtonhoverface:
        aColor = BG_PRELIGHT_COLOR;
        break;
    case ColorID::MozButtonhovertext:
        aColor = FG_PRELIGHT_COLOR;
        break;
    case ColorID::MozCellhighlight:
    case ColorID::MozHtmlCellhighlight:
        aColor = BASE_ACTIVE_COLOR;
        break;
    case ColorID::MozCellhighlighttext:
    case ColorID::MozHtmlCellhighlighttext:
        aColor = TEXT_ACTIVE_COLOR;
        break;
    case ColorID::MozMenuhover:
        aColor = BG_PRELIGHT_COLOR;
        break;
    case ColorID::MozMenuhovertext:
        aColor = FG_PRELIGHT_COLOR;
        break;
    case ColorID::MozOddtreerow:
        aColor = NS_TRANSPARENT;
        break;
    case ColorID::MozNativehyperlinktext:
        aColor = NS_SAME_AS_FOREGROUND_COLOR;
        break;
    case ColorID::MozComboboxtext:
        aColor = TEXT_NORMAL_COLOR;
        break;
    case ColorID::MozCombobox:
        aColor = BG_NORMAL_COLOR;
        break;
    case ColorID::MozMenubartext:
        aColor = TEXT_NORMAL_COLOR;
        break;
    case ColorID::MozMenubarhovertext:
        aColor = FG_PRELIGHT_COLOR;
        break;
    default:
        /* default color is BLACK */
        aColor = 0;
        rv = NS_ERROR_FAILURE;
        break;
    }

    return rv;
}

nsresult
nsLookAndFeel::GetIntImpl(IntID aID, int32_t &aResult)
{
    nsresult rv = nsXPLookAndFeel::GetIntImpl(aID, aResult);
    if (NS_SUCCEEDED(rv))
        return rv;

    rv = NS_OK;

    switch (aID) {
        case eIntID_CaretBlinkTime:
            aResult = 500;
            break;

        case eIntID_CaretWidth:
            aResult = 1;
            break;

        case eIntID_ShowCaretDuringSelection:
            aResult = 0;
            break;

        case eIntID_SelectTextfieldsOnKeyFocus:
            // Select textfield content when focused by kbd
            // used by EventStateManager::sTextfieldSelectModel
            aResult = 1;
            break;

        case eIntID_SubmenuDelay:
            aResult = 200;
            break;

        case eIntID_TooltipDelay:
            aResult = 500;
            break;

        case eIntID_MenusCanOverlapOSBar:
            // we want XUL popups to be able to overlap the task bar.
            aResult = 1;
            break;

        case eIntID_ScrollArrowStyle:
            aResult = eScrollArrowStyle_Single;
            break;

        case eIntID_ScrollSliderStyle:
            aResult = eScrollThumbStyle_Proportional;
            break;

        case eIntID_TouchEnabled:
            aResult = 1;
            break;

        case eIntID_WindowsDefaultTheme:
        case eIntID_WindowsThemeIdentifier:
        case eIntID_OperatingSystemVersionIdentifier:
            aResult = 0;
            rv = NS_ERROR_NOT_IMPLEMENTED;
            break;

        case eIntID_IMERawInputUnderlineStyle:
        case eIntID_IMEConvertedTextUnderlineStyle:
            aResult = NS_STYLE_TEXT_DECORATION_STYLE_SOLID;
            break;

        case eIntID_IMESelectedRawTextUnderlineStyle:
        case eIntID_IMESelectedConvertedTextUnderline:
            aResult = NS_STYLE_TEXT_DECORATION_STYLE_NONE;
            break;

        case eIntID_SpellCheckerUnderlineStyle:
            aResult = NS_STYLE_TEXT_DECORATION_STYLE_WAVY;
            break;

        case eIntID_ScrollbarButtonAutoRepeatBehavior:
            aResult = 0;
            break;

// TODO: implement physical home button??
#if 0
        case eIntID_PhysicalHomeButton: {
            char propValue[PROPERTY_VALUE_MAX];
            property_get("ro.moz.has_home_button", propValue, "1");
            aResult = atoi(propValue);
            break;
        }
#endif
            
        case eIntID_ContextMenuOffsetVertical:
        case eIntID_ContextMenuOffsetHorizontal:
            aResult = 2;
            break;

        default:
            aResult = 0;
            rv = NS_ERROR_FAILURE;
    }

    return rv;
}

nsresult
nsLookAndFeel::GetFloatImpl(FloatID aID, float &aResult)
{
  nsresult res = nsXPLookAndFeel::GetFloatImpl(aID, aResult);
  if (NS_SUCCEEDED(res))
    return res;
  res = NS_OK;

  switch (aID) {
    case eFloatID_IMEUnderlineRelativeSize:
        aResult = 1.0f;
        break;
    case eFloatID_SpellCheckerUnderlineRelativeSize:
        aResult = 1.0f;
        break;
    default:
        aResult = -1.0;
        res = NS_ERROR_FAILURE;
    }
  return res;
}

/*virtual*/
bool
nsLookAndFeel::GetFontImpl(FontID aID, nsString& aFontName,
                           gfxFontStyle& aFontStyle)
{
    aFontName.AssignLiteral("\"Fira Sans\"");
    aFontStyle.style = mozilla::FontSlantStyle::Normal();
    aFontStyle.weight = mozilla::FontWeight::Normal();
    aFontStyle.stretch = mozilla::FontStretch::Normal();
    aFontStyle.size = 9.0 * 96.0f / 72.0f;
    aFontStyle.systemFont = true;
    return true;
}

/*virtual*/
bool
nsLookAndFeel::GetEchoPasswordImpl() {
    return true;
}

/*virtual*/
uint32_t
nsLookAndFeel::GetPasswordMaskDelayImpl()
{
    // Same value on Android framework
    return 1500;
}

/* virtual */
char16_t
nsLookAndFeel::GetPasswordCharacterImpl()
{
    return UNICODE_BULLET;
}
