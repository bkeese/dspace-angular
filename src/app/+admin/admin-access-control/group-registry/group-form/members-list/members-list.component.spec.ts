import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, fakeAsync, flush, inject, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule, By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/internal/Observable';
import { RestResponse } from '../../../../../core/cache/response.models';
import { PaginatedList } from '../../../../../core/data/paginated-list';
import { RemoteData } from '../../../../../core/data/remote-data';
import { EPersonDataService } from '../../../../../core/eperson/eperson-data.service';
import { GroupDataService } from '../../../../../core/eperson/group-data.service';
import { EPerson } from '../../../../../core/eperson/models/eperson.model';
import { Group } from '../../../../../core/eperson/models/group.model';
import { PageInfo } from '../../../../../core/shared/page-info.model';
import { FormBuilderService } from '../../../../../shared/form/builder/form-builder.service';
import { getMockFormBuilderService } from '../../../../../shared/mocks/mock-form-builder-service';
import { MockRouter } from '../../../../../shared/mocks/mock-router';
import { getMockTranslateService } from '../../../../../shared/mocks/mock-translate.service';
import { NotificationsService } from '../../../../../shared/notifications/notifications.service';
import { EPersonMock, EPersonMock2 } from '../../../../../shared/testing/eperson-mock';
import { GroupMock, GroupMock2 } from '../../../../../shared/testing/group-mock';
import { MockTranslateLoader } from '../../../../../shared/testing/mock-translate-loader';
import { NotificationsServiceStub } from '../../../../../shared/testing/notifications-service-stub';
import { of as observableOf } from 'rxjs';
import { createSuccessfulRemoteDataObject$ } from '../../../../../shared/testing/utils';
import { MembersListComponent } from './members-list.component';

describe('MembersListComponent', () => {
  let component: MembersListComponent;
  let fixture: ComponentFixture<MembersListComponent>;
  let translateService: TranslateService;
  let builderService: FormBuilderService;
  let ePersonDataServiceStub: any;
  let groupsDataServiceStub: any;
  let activeGroup;
  let allEPersons;
  let allGroups;
  let epersonMembers;
  let subgroupMembers;

  beforeEach(async(() => {
    activeGroup = GroupMock;
    epersonMembers = [EPersonMock2];
    subgroupMembers = [GroupMock2];
    allEPersons = [EPersonMock, EPersonMock2];
    allGroups = [GroupMock, GroupMock2];
    ePersonDataServiceStub = {
      activeGroup: activeGroup,
      epersonMembers: epersonMembers,
      subgroupMembers: subgroupMembers,
      findAllByHref(href: string): Observable<RemoteData<PaginatedList<EPerson>>> {
        return createSuccessfulRemoteDataObject$(new PaginatedList<EPerson>(new PageInfo(), groupsDataServiceStub.getEPersonMembers()))
      },
      searchByScope(scope: string, query: string): Observable<RemoteData<PaginatedList<EPerson>>> {
        if (query === '') {
          return createSuccessfulRemoteDataObject$(new PaginatedList(new PageInfo(), allEPersons))
        }
        return createSuccessfulRemoteDataObject$(new PaginatedList(new PageInfo(), []))
      },
      clearEPersonRequests() {
        // empty
      },
      clearLinkRequests() {
        // empty
      },
      getEPeoplePageRouterLink(): string {
        return '/admin/access-control/epeople';
      }
    };
    groupsDataServiceStub = {
      activeGroup: activeGroup,
      epersonMembers: epersonMembers,
      subgroupMembers: subgroupMembers,
      allGroups: allGroups,
      getActiveGroup(): Observable<Group> {
        return observableOf(activeGroup);
      },
      getEPersonMembers() {
        return this.epersonMembers;
      },
      searchGroups(query: string): Observable<RemoteData<PaginatedList<Group>>> {
        if (query === '') {
          return createSuccessfulRemoteDataObject$(new PaginatedList(new PageInfo(), this.allGroups))
        }
        return createSuccessfulRemoteDataObject$(new PaginatedList(new PageInfo(), []))
      },
      addMemberToGroup(parentGroup, eperson: EPerson): Observable<RestResponse> {
        this.epersonMembers = [...this.epersonMembers, eperson];
        return observableOf(new RestResponse(true, 200, 'Success'));
      },
      clearGroupsRequests() {
        // empty
      },
      clearGroupLinkRequests() {
        // empty
      },
      getGroupEditPageRouterLink(group: Group): string {
        return '/admin/access-control/groups/' + group.id;
      },
      deleteMemberFromGroup(parentGroup, epersonToDelete: EPerson): Observable<RestResponse> {
        this.epersonMembers = this.epersonMembers.find((eperson: EPerson) => {
          if (eperson.id !== epersonToDelete.id) {
            return eperson;
          }
        });
        if (this.epersonMembers === undefined) {
          this.epersonMembers = []
        }
        return observableOf(new RestResponse(true, 200, 'Success'));
      }
    };
    builderService = getMockFormBuilderService();
    translateService = getMockTranslateService();
    TestBed.configureTestingModule({
      imports: [CommonModule, NgbModule, FormsModule, ReactiveFormsModule, BrowserModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: MockTranslateLoader
          }
        }),
      ],
      declarations: [MembersListComponent],
      providers: [MembersListComponent,
        { provide: EPersonDataService, useValue: ePersonDataServiceStub },
        { provide: GroupDataService, useValue: groupsDataServiceStub },
        { provide: NotificationsService, useValue: new NotificationsServiceStub() },
        { provide: FormBuilderService, useValue: builderService },
        { provide: Router, useValue: new MockRouter() },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MembersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  afterEach(fakeAsync(() => {
    fixture.destroy();
    flush();
    component = null;
  }));

  it('should create MembersListComponent', inject([MembersListComponent], (comp: MembersListComponent) => {
    expect(comp).toBeDefined();
  }));

  it('should show list of eperson members of current active group', () => {
    const epersonIdsFound = fixture.debugElement.queryAll(By.css('#ePeopleMembersOfGroup tr td:first-child'));
    expect(epersonIdsFound.length).toEqual(1);
    epersonMembers.map((eperson: EPerson) => {
      expect(epersonIdsFound.find((foundEl) => {
        return (foundEl.nativeElement.textContent.trim() === eperson.uuid);
      })).toBeTruthy();
    });
  });

  describe('search', () => {
    describe('when searching without query', () => {
      let epersonsFound;
      beforeEach(fakeAsync(() => {
        component.search({ scope: 'metadata', query: '' });
        tick();
        fixture.detectChanges();
        epersonsFound = fixture.debugElement.queryAll(By.css('#epersonsSearch tbody tr'));
      }));

      it('should display all epersons', () => {
        expect(epersonsFound.length).toEqual(2);
      });

      describe('if eperson is already a eperson', () => {
        it('should have delete button, else it should have add button', () => {
          activeGroup.epersons.map((eperson: EPerson) => {
            epersonsFound.map((foundEPersonRowElement) => {
              if (foundEPersonRowElement.debugElement !== undefined) {
                const epersonId = foundEPersonRowElement.debugElement.query(By.css('td:first-child'));
                const addButton = foundEPersonRowElement.debugElement.query(By.css('td:last-child .fa-plus'));
                const deleteButton = foundEPersonRowElement.debugElement.query(By.css('td:last-child .fa-trash-alt'));
                if (epersonId.nativeElement.textContent === eperson.id) {
                  expect(addButton).toBeUndefined();
                  expect(deleteButton).toBeDefined();
                } else {
                  expect(deleteButton).toBeUndefined();
                  expect(addButton).toBeDefined();
                }
              }
            })
          })
        });
      });

      describe('if first add button is pressed', () => {
        beforeEach(fakeAsync(() => {
          const addButton = fixture.debugElement.query(By.css('#epersonsSearch tbody .fa-plus'));
          addButton.nativeElement.click();
          tick();
          fixture.detectChanges();
        }));
        it('all groups in search member of selected group', () => {
          epersonsFound = fixture.debugElement.queryAll(By.css('#epersonsSearch tbody tr'));
          expect(epersonsFound.length).toEqual(2);
          epersonsFound.map((foundEPersonRowElement) => {
            if (foundEPersonRowElement.debugElement !== undefined) {
              const addButton = foundEPersonRowElement.debugElement.query(By.css('td:last-child .fa-plus'));
              const deleteButton = foundEPersonRowElement.debugElement.query(By.css('td:last-child .fa-trash-alt'));
              expect(addButton).toBeUndefined();
              expect(deleteButton).toBeDefined();
            }
          })
        });
      });

      describe('if first delete button is pressed', () => {
        beforeEach(fakeAsync(() => {
          const addButton = fixture.debugElement.query(By.css('#epersonsSearch tbody .fa-trash-alt'));
          addButton.nativeElement.click();
          tick();
          fixture.detectChanges();
        }));
        it('first eperson in search delete button, because now member', () => {
          epersonsFound = fixture.debugElement.queryAll(By.css('#epersonsSearch tbody tr'));
          epersonsFound.map((foundEPersonRowElement) => {
            if (foundEPersonRowElement.debugElement !== undefined) {
              const addButton = foundEPersonRowElement.debugElement.query(By.css('td:last-child .fa-plus'));
              const deleteButton = foundEPersonRowElement.debugElement.query(By.css('td:last-child .fa-trash-alt'));
              expect(deleteButton).toBeUndefined();
              expect(addButton).toBeDefined();
            }
          })
        });
      });
    });
  });

});
