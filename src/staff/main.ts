// 직원 콘솔 앱 진입점. 조립은 wiring/, 화면은 ui/staff_screen.ts. 여기에 업무 규칙을 두지 않는다.
import { mountStaffScreen } from "../ui/staff_screen.ts";
import { createPublicApiClient, createStaffApi } from "../wiring/public_api.ts";

mountStaffScreen(createStaffApi(createPublicApiClient({ baseUrl: "/v1" })));
