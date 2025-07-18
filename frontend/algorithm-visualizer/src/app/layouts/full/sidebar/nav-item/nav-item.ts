export interface NavItem {
    id: number;
    displayName?: string;
    iconName?: string;
    navCap?: string;
    route?: string;
    children?: NavItem[];
    chip?: boolean;
    chipContent?: string;
    chipClass?: string;
    external?: boolean;
    type?: string;
    shouldExpand?: boolean;
    onClick?: () => void;
}