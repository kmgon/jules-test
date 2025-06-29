export const colors = {
  inherit: 'inherit',
  current: 'currentColor',
  transparent: 'transparent',
  common: {
    white: '#ffffff',
    black: '#000000',
    notification: 'var(--COMMON_NOTIFICATION_MAIN, #FF0041)',
    black10P: 'var(--COMMON_BLACK_10P, #0000001a)',
    white8P: 'var(--COMMON_WHITE_8P, #FFFFFF14)',
    white30P: 'var(--COMMON_WHITE_30P, #FFFFFF4D)',
    white60P: 'var(--COMMON_WHITE_60P, #FFFFFF99)',
    white80P: 'var(--COMMON_WHITE_80P, #FFFFFFCC)',
    white100P: 'var(--COMMON_WHITE_100P, #FFFFFF)',
  },
  action: {
    active: 'var(--LIGHT_ACTION_ACTIVE_54P, #0010418A)',
    hover: 'var(--LIGHT_ACTION_HOVER_4P, #255DBD0A)',
    selected: 'var(--LIGHT_ACTION_SELECTED_8P, #255DBD14)',
    disabled: 'var(--LIGHT_ACTION_DISABLED_26P, #00104142)',
    disabledBackground: 'var(--LIGHT_ACTION_DISABLED_BACKGROUND_12P, #0010411F)',
    focus: 'var(--LIGHT_ACTION_FOCUS_12P, #255DBD1F)',
    '30P': 'var(--LIGHT_ACTION_SHADES_30P, #0010414D)',
  },
  odds: {
    active: 'var(--LIGHT_ODDS_ACTIVE, #E3F1FD)',
    hover: 'var(--LIGHT_ODDS_HOVER, #CFE7FC)',
    selected: 'var(--LIGHT_ODDS_SELECTED, #1AFFFF)',
    selectedBackground: 'var(--LIGHT_ODDS_SELECTED, #001041)',
    selectedHover: 'var(--LIGHT_ODDS_SELECTED_HOVER, #192754)',
    disabled: 'var(--LIGHT_ODDS_DISABLED, #00104142)',
    disabledBackground: 'var(--LIGHT_ODDS_DISABLED, #0010411F)',
  },
  background: {
    paper: 'var(--LIGHT_BACKGROUND_PAPER, #FFFFFF)',
    default: 'var(--LIGHT_BACKGROUND_DEFAULT, #F6F9FC)',
    backdrop: 'var(--LIGHT_BACKGROUND_BACKDROP, #001041)',
    'backdrop-80': 'var(--LIGHT_BACKGROUND_BACKDROP_80, #001041CC)',
    '4P': 'var(--LIGHT_BACKGROUND_4P, #F6F9FC)',
    '8P': 'var(--LIGHT_BACKGROUND_8P, #EEF2FA)',
    '12P': 'var(--LIGHT_BACKGROUND_12P, #E5ECF7)',
    skeleton: 'var(--LIGHT_BACKGROUND_SKELETON, #DEE6F5)',
  },
  divider: 'var(--LIGHT_OTHER_DIVIDER, #255DBD1F)',
  input: {
    background: 'var(--LIGHT_OTHER_FILLED_INPUT_BACKGROUND, #255DBD0F)',
    line: 'var(--LIGHT_OTHER_STANDARD_INPUT_LINE, #255DBD6B)',
  },
  snackbar: 'var(--LIGHT_OTHER_SNACKBAR, #323232)',
  overlay: 'var(--LIGHT_OTHER_BACKDROP_OVERLAY, #001041CC)',
  other: {
    '23P': 'var(--LIGHT_OTHER_OUTLINED_BORDER_23P, #255DBD3B)',
    active: 'var(--LIGHT_OTHER_RATING_ACTIVE, #FFB400)',
    light: 'var(--LIGHT_OTHER_RATING_LIGHT, #FFC400)',
  },
  text: {
    primary: 'var(--LIGHT_TEXT_PRIMARY, #000C2DDE)',
    secondary: 'var(--LIGHT_TEXT_SECONDARY, #000C2D99)',
    disabled: 'var(--LIGHT_TEXT_DISABLED, #000C2D61)',
    primary4P: 'var(--LIGHT_TEXT_PRIMARY_SHADES_4P, #000C2D0A)',
    primary12P: 'var(--LIGHT_TEXT_PRIMARY_SHADES_12P, #000C2D1F)',
    primary30P: 'var(--LIGHT_TEXT_PRIMARY_SHADES_30P, #000C2D4D)',
    primary60P: 'var(--LIGHT_TEXT_PRIMARY_SHADES_60P, #000C2D99)',
  },
  primary: {
    main: 'var(--LIGHT_PRIMARY_MAIN, #001041)',
    dark: 'var(--LIGHT_PRIMARY_DARK, #000B2D)',
    light: 'var(--LIGHT_PRIMARY_LIGHT, #333F67)',
    contrastText: 'var(--LIGHT_PRIMARY_CONTRAST_TEXT, #FFFFFF)',
    '50': 'var(--LIGHT_PRIMARY_SHADES_50, #E3E5ED)',
    '100': 'var(--LIGHT_PRIMARY_SHADES_100, #B9BFD4)',
    '200': 'var(--LIGHT_PRIMARY_SHADES_200, #8D96B6)',
    '300': 'var(--LIGHT_PRIMARY_SHADES_300, #626E9A)',
    '400': 'var(--LIGHT_PRIMARY_SHADES_400, #435287)',
    '500': 'var(--LIGHT_PRIMARY_SHADES_500, #213775)',
    '600': 'var(--LIGHT_PRIMARY_SHADES_600, #1B306D)',
    '700': 'var(--LIGHT_PRIMARY_SHADES_700, #132863)',
    '800': 'var(--LIGHT_PRIMARY_SHADES_800, #0A1F57)',
    '900': 'var(--LIGHT_PRIMARY_SHADES_900, #001041)',
    '4P': 'var(--LIGHT_PRIMARY_SHADES_4P, #0010410A)',
    '8P': 'var(--LIGHT_PRIMARY_SHADES_8P, #00104114)',
    '12P': 'var(--LIGHT_PRIMARY_SHADES_12P, #0010411F)',
    '30P': 'var(--LIGHT_PRIMARY_SHADES_30P, #0010414D)',
    '40P': 'var(--LIGHT_PRIMARY_SHADES_40P, #00104166)',
    '50P': 'var(--LIGHT_PRIMARY_SHADES_50P, #00104180)',
    '60P': 'var(--LIGHT_PRIMARY_SHADES_60P, #00104199)',
    '80P': 'var(--LIGHT_PRIMARY_SHADES_80P, #001041CC)',
  },
  secondary: {
    main: 'var(--LIGHT_SECONDARY_MAIN, #255DBD)',
    dark: 'var(--LIGHT_SECONDARY_DARK, #194184)',
    light: 'var(--LIGHT_SECONDARY_LIGHT, #507DCA)',
    contrastText: 'var(--LIGHT_SECONDARY_CONTRAST_TEXT, #FFFFFF)',
    '4P': 'var(--LIGHT_SECONDARY_SHADES_4P, #255DBD0A)',
    '8P': 'var(--LIGHT_SECONDARY_SHADES_8P, #255DBD14)',
    '12P': 'var(--LIGHT_SECONDARY_SHADES_12P, #255DBD1F)',
    '30P': 'var(--LIGHT_SECONDARY_SHADES_30P, #255DBD4D)',
    '50P': 'var(--LIGHT_SECONDARY_SHADES_50P, #255DBD80)',
  },
  value: {
    main: 'var(--COMMON_VALUE_MAIN, #FFC400)',
    dark: 'var(--COMMON_VALUE_MAIN, #E5B000)',
    light: 'var(--COMMON_VALUE_MAIN, #FFD64D)',
    contrastText: 'var(--COMMON_VALUE_CONTRAST, #001041)',
    '4P': 'var(--COMMON_VALUE_4P, #FFC4000A)',
    '8P': 'var(--COMMON_VALUE_8P, #FFC40014)',
    '12P': 'var(--COMMON_VALUE_12P, #FFC4001F)',
    '30P': 'var(--COMMON_VALUE_30P, #FFC4004D)',
    '40P': 'var(--COMMON_VALUE_40P, #FFC40066)',
    '50P': 'var(--COMMON_VALUE_50P, #FFC40080)',
  },
  highlight: {
    main: 'var(--COMMON_HIGHLIGHT_VALUE_MAIN, #1AFFFF)',
    dark: 'var(--COMMON_HIGHLIGHT_VALUE_MAIN, #12B2B2)',
    light: 'var(--COMMON_HIGHLIGHT_VALUE_MAIN, #47FFFF)',
    contrastText: 'var(--COMMON_HIGHLIGHT_CONTRAST, #001041)',
    '4P': 'var(--COMMON_HIGHLIGHT_VALUE_MAIN_4P, #1AFFFF0A)',
    '8P': 'var(--COMMON_HIGHLIGHT_VALUE_MAIN_8P, #1AFFFF14)',
    '12P': 'var(--COMMON_HIGHLIGHT_VALUE_MAIN_12P, #1AFFFF1F)',
    '30P': 'var(--COMMON_HIGHLIGHT_VALUE_MAIN_30P, #1AFFFF4D)',
    '50P': 'var(--COMMON_HIGHLIGHT_VALUE_MAIN_50P, #1AFFFF80)',
  },
  hybrid: {
    primary: 'var(--LIGHT_HYBRID_TEXT_PRIMARY, #E3F1FD)',
    secondary: 'var(--LIGHT_HYBRID_TEXT_SECONDARY, #E3F1FDB3)',
    disabled: 'var(--LIGHT_HYBRID_TEXT_DISABLED, #E3F1FD80)',
    '4P': 'var(--LIGHT_HYBRID_TEXT_4P, #E3F1FD0A)',
    '8P': 'var(--LIGHT_HYBRID_TEXT_8P, #E3F1FD14)',
    '12P': 'var(--LIGHT_HYBRID_TEXT_12P, #E3F1FD1F)',
    '16p': 'var(--LIGHT_HYBRID_TEXT_16P, #E3F1FD29)',
    '30P': 'var(--LIGHT_HYBRID_TEXT_30P, #E3F1FD4D)',
    '50P': 'var(--LIGHT_HYBRID_TEXT_50P, #E3F1FD80)',
    '60P': 'var(--LIGHT_HYBRID_TEXT_60P, #E3F1FD99)',
  },
  error: {
    main: 'var(--LIGHT_ERROR_MAIN, #D32F2F)',
    dark: 'var(--LIGHT_ERROR_DARK, #C62828)',
    light: 'var(--LIGHT_ERROR_LIGHT, #EF5350)',
    contrastText: 'var(--LIGHT_ERROR_CONTRAST, #FFFFFF)',
    '4P': 'var(--LIGHT_ERROR_SHADES_4P, #D32F2F0A)',
    '12P': 'var(--LIGHT_ERROR_SHADES_12P, #D32F2F1F)',
    '30P': 'var(--LIGHT_ERROR_SHADES_30P, #D32F2F4D)',
    '50P': 'var(--LIGHT_ERROR_SHADES_50P, #D32F2F80)',
    '160P': 'var(--LIGHT_ERROR_SHADES_160P, #541313)',
    '190P': 'var(--LIGHT_ERROR_SHADES_190P, #FBEAEA)',
  },
  warning: {
    main: 'var(--LIGHT_WARNING_MAIN, #ED6C02)',
    dark: 'var(--LIGHT_WARNING_DARK, #E65100)',
    light: 'var(--LIGHT_WARNING_LIGHT, #FF9800)',
    contrastText: 'var(--LIGHT_WARNING_CONTRAST, #FFFFFF)',
    '4P': 'var(--LIGHT_WARNING_SHADES_4P, #ED6C020A)',
    '12P': 'var(--LIGHT_WARNING_SHADES_12P, #ED6C021F)',
    '30P': 'var(--LIGHT_WARNING_SHADES_30P, #ED6C024D)',
    '50P': 'var(--LIGHT_WARNING_SHADES_50P, #ED6C0280)',
    '160P': 'var(--LIGHT_WARNING_SHADES_160P, #5F2B01)',
    '190P': 'var(--LIGHT_WARNING_SHADES_190P, #FDF0E6)',
  },
  info: {
    main: 'var(--LIGHT_INFO_MAIN, #0288D1)',
    dark: 'var(--LIGHT_INFO_DARK, #01579B)',
    light: 'var(--LIGHT_INFO_LIGHT, #03A9F4)',
    contrastText: 'var(--LIGHT_INFO_CONTRAST, #FFFFFF)',
    '4P': 'var(--LIGHT_INFO_SHADES_4P, #0288D10A)',
    '12P': 'var(--LIGHT_INFO_SHADES_12P, #0288D11F)',
    '30P': 'var(--LIGHT_INFO_SHADES_30P, #0288D14D)',
    '50P': 'var(--LIGHT_INFO_SHADES_50P, #0288D180)',
    '160P': 'var(--LIGHT_INFO_SHADES_160P, #013654)',
    '190P': 'var(--LIGHT_INFO_SHADES_190P, #E6F3FA)',
  },
  success: {
    main: 'var(--LIGHT_SUCCESS_MAIN, #4CAF50)',
    dark: 'var(--LIGHT_SUCCESS_DARK, #357A38)',
    light: 'var(--LIGHT_SUCCESS_LIGHT, #6FBF73)',
    contrastText: 'var(--LIGHT_SUCCESS_CONTRAST, #FFFFFF)',
    '4P': 'var(--LIGHT_SUCCESS_SHADES_4P, #4CAF500A)',
    '12P': 'var(--LIGHT_SUCCESS_SHADES_12P, #4CAF501F)',
    '30P': 'var(--LIGHT_SUCCESS_SHADES_30P, #4CAF504D)',
    '50P': 'var(--LIGHT_SUCCESS_SHADES_50P, #4CAF5080)',
    '160P': 'var(--LIGHT_SUCCESS_SHADES_160P, #123214)',
    '190P': 'var(--LIGHT_SUCCESS_SHADES_190P, #EAF2EA)',
  },
  grey: {
    '50': 'var(--GREY_50, #FAFAFA)',
    '100': 'var(--GREY_100, #F5F5F5)',
    '200': 'var(--GREY_200, #EEEEEE)',
    '300': 'var(--GREY_300, #E0E0E0)',
    '400': 'var(--GREY_400, #BDBDBD)',
    '500': 'var(--GREY_500, #9E9E9E)',
    '600': 'var(--GREY_600, #757575)',
    '700': 'var(--GREY_700, #616161)',
    '800': 'var(--GREY_800, #424242)',
    '900': 'var(--GREY_900, #212121)',
    A100: 'var(--GREY_A100, #D5D5D5)',
    A200: 'var(--GREY_A200, #AAAAAA)',
    A400: 'var(--GREY_A400, #616161)',
    A700: 'var(--GREY_A700, #303030)',
  },
};
