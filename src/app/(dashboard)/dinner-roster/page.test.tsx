import { expect,it,vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks=vi.hoisted(()=>({access:vi.fn(),read:vi.fn()}));
vi.mock("@/lib/auth/authorization",()=>({requireAuthorised:mocks.access}));
vi.mock("@/features/dinner-verification/roster",()=>({readGlobalDinnerRoster:mocks.read,rosterFailure:()=>({code:"PERMISSION_DENIED"})}));
vi.mock("@/features/dinner-verification/actions",()=>({addDinnerRosterEntry:vi.fn(),removeDinnerRosterMember:vi.fn()}));
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
import Page from "./page";
it("denies nonadministrators before loading the shared roster",async()=>{
  mocks.access.mockResolvedValue({canManageAccounts:false});
  expect(renderToStaticMarkup(await Page())).not.toContain('name="fullName"');
  expect(mocks.read).not.toHaveBeenCalled();
});
it("offers a standalone roster without any event ID input",async()=>{
  mocks.access.mockResolvedValue({canManageAccounts:true});
  mocks.read.mockResolvedValue({ok:true,items:[]});
  const html=renderToStaticMarkup(await Page());
  expect(html).toContain("Shared dinner eligibility roster");
  expect(html).toContain("Eligibility continues across events");
  expect(html).toContain('name="email"');
  expect(html).not.toContain('name="eventId"');
});
