import { api } from "./Service";
import { IUserSettings } from "common-types/types/expenses";

export default class SettingsService {
  private basePath = "/api/settings";

  public getSettings = async (): Promise<IUserSettings> => {
    const { data } = await api.get(`${this.basePath}/getSettings`);
    return data;
  };

  public saveSettings = async (settings: IUserSettings) => {
    const { data } = await api.post(`${this.basePath}/saveSettings`, settings);
    return data;
  };
}
